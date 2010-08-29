STAT_FIELDS = ['client_conn', 'client_req', 'cache_hit', 'cache_miss', 's_sess', 's_req',
               's_pass', 's_fetch', 'backend_req'
              ];

var url             = require('url')
  , http            = require('http')
  , spawn           = require('child_process').spawn
  , crypto          = require('crypto')
  , io              = require('socket.io')
  , config          = require('./config')
  , redisClient     = require('redis-client').createClient(config.redis.port, config.redis.host)
  , lastStats       = null
  , varnish         = new(require('./varnish-ext/build/default/varnish').Varnish)('/tmp')
  , frontend        = new http.Server()
  , frontendStatic  = new(require('node-static').Server)('./public')
  , socket          = io.listen(frontend)
  , bitly           = new(require('./lib/bitly').Bitly)()
  , twitter         = new(require('./lib/twitter').Twitter)( config.twitter.host
                                                           , config.twitter.endpoint
                                                           , config.twitter.auth
                                                           )
  , child = spawn(config.varnish.run, [ '-a' + config.varnish.host + ':' + config.varnish.port
                                      , '-f' + config.varnish.config
                                      , '-s malloc'
                                      , '-n/tmp'
                                      , '-F'
                                      ]);

function urlHash(input) {
  var hash = crypto.createHash('md5')

  hash.update(input)

  return hash.digest('base64')
}

child.stderr.on('data', function (data) {
  console.log('varnish child process: ' + data);
});

// always kill the child
process.on('exit', function() {
  child.kill()
})
process.on('uncaughtException', function(err) {
  child.kill()

  if(typeof(err) === 'string')
    console.log(err)
  else
    console.log(err.message), console.log(err.stack)

  process.exit()
})

// handle static file requests + websocket clients
frontend.on('request', function (req, res) {
  req.on('end', function () {
    frontendStatic.serve(req, res)
  });
});

socket.on('connection', function (client) {
  client.broadcast({ announcement: client.sessionId + ' connected' });
});

frontend.listen(config.frontend.port);

// generate events and broadcast to all clients
setInterval(function () {
  var currentStats = varnish.stats()

  for (var i=0; i<STAT_FIELDS.length; i++) {
    socket.broadcast(
      JSON.stringify({ key: STAT_FIELDS[i]
                     , value: { ag: currentStats[STAT_FIELDS[i]]
                              , av: (lastStats ? currentStats[STAT_FIELDS[i]] - lastStats[STAT_FIELDS[i]] : currentStats[STAT_FIELDS[i]]) * 10
                              }
                     })
    )
  }

  lastStats = currentStats
}, 1000);

// generate varnish requests from bit.ly urls
twitter.on('message', function (msg) {
  var varnishClient = http.createClient(config.varnish.port, config.varnish.host)
    , request = varnishClient.request('GET', '/' + msg, { host: config.varnish.host })

  varnishClient.on('error', function (err) {});
  request.on('error', function (err) {});
  request.end();
});

twitter.on('error', function(err) {
  throw err
})

// generate varnish traffic
varnish.on('RxURL', function (tag, fd, spec, url) {
  var cast = function(m) { socket.broadcast(JSON.stringify(m)) }
    , pack = { key:  'request'
             , value: {}
             }

  url = 'http:/' + url

  redisClient.type(url, function(err, type) {
    if(err) throw err

    if(type === undefined) console.dir(arguments)

    type = type.toString()

    switch(type) {
      case 'none':
        redisClient.lpush(url, '0', function(err, elems) {
          if(err) throw err
        })

        break;
      case 'list':
        bitly.expandMoar(url, function(hdrs) {
          var url = hdrs['location']

          redisClient.set(url, url, function(err, code) {
            if(err) throw err

            pack.value.url = url
            pack.value.hash = urlHash(url)

            cast(pack)

            redisClient.expire(url, (60 * 5), function(err, code) {
              if(err) throw err
            })
          })
        })

        break;
      case 'string':
        redisClient.get(url, function(err, url) {
          if(err) throw err

          if(typeof(url) === undefined) console.dir(arguments)

          pack.value.url = url.toString()
          pack.value.hash = urlHash(url.toString())

          cast(pack)
        })

        break;
      default:
        console.log('type is: ' + type)
    }
  })
});

redisClient.auth(config.redis.password, function(err, authorized) {
  if(err) throw err

  redisClient.flushall(function() {
    twitter.read();
  })
})

setInterval(function() {
  varnish.listen();
}, 500);
