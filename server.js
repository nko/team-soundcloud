var url         = require('url')
  , http        = require('http')
  , spawn       = require('child_process').spawn
  , crypto      = require('crypto')
  , io          = require('socket.io')
  , config      = require('./config')
  , lastStats   = null
  , statFields  = config.varnish.statFields
  , redisClient = require('redis-client').createClient(config.redis.port, config.redis.host)
  , varnish     = new(require('./varnish-ext/build/default/varnish').Varnish)('/tmp')
  , frontend    = new http.Server()
  , staticSrv   = new(require('node-static').Server)('./public')
  , socket      = io.listen(frontend)
  , bitly       = new(require('./lib/bitly').Bitly)()
  , twitter     = new(require('./lib/twitter').Twitter)(config.twitter.host, config.twitter.endpoint, config.twitter.auth)
  , urlHash     = function(x) { return crypto.createHash('md5').update(x).digest('hex') }


// handle static file requests + websocket clients
frontend.on('request', function (req, res) {
  req.on('end', function () {
    staticSrv.serve(req, res)
  });
});

socket.on('connection', function (client) {
  client.broadcast({ announcement: client.sessionId + ' connected' });
});

frontend.listen(config.frontend.port);

// generate events and broadcast to all clients
setInterval(function () {
  var currentStats = varnish.stats()

  for (var i=0; i< statFields.length; i++) {
    socket.broadcast(
      JSON.stringify({ key: statFields[i]
                     , value: { ag: currentStats[statFields[i]]
                              , av: (lastStats ? currentStats[statFields[i]] - lastStats[statFields[i]] : currentStats[statFields[i]]) * 10
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

  varnishClient.on('error', function (err) { console.log(err.stack) });
  request.on('error', function (err) { console.log(err.stack) });
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

  redisClient.exists(url, function(err, exist) {
    if(err) throw err

    if(exist) {
      redisClient.get(url, function(err, resolvedUrl) {
        if(err) throw err

        pack.value.url = resolvedUrl.toString()
        pack.value.hash = urlHash(resolvedUrl.toString())

        cast(pack)
      })
    } else {
      bitly.expandMoar(url, function(ok, hdrs) {
        if(!ok) return false

        var resolvedUrl = hdrs['location']

        redisClient.set(url, resolvedUrl, function(err, code) {
          if(err) throw err

          pack.value.url = resolvedUrl
          pack.value.hash = urlHash(resolvedUrl)

          cast(pack)

          redisClient.expire(url, (60 * 5), function(err, code) {
            if(err) throw err
          })
        })
      })
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
