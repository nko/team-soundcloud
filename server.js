var url             = require('url')
  , http            = require('http')
  , spawn           = require('child_process').spawn
  , io              = require('socket.io')
  , config          = require('./config')
  , redisClient     = require('redis-client').createClient(config.redis.port, config.redis.host)
  , varnish         = new(require('./varnish-ext/build/default/varnish').Varnish)('/tmp')
  , frontend        = new http.Server()
  , frontendStatic  = new(require('node-static').Server)('./public')
  , socket          = io.listen(frontend)
  , twitter         = new(require('./lib/twitter').Twitter)( config.twitter.host
                                                          , config.twitter.endpoint
                                                          , config.twitter.auth
                                                          )
  // start a varnish instance
  , child = spawn(config.varnish.run, [ '-a' + config.varnish.host + ':' + config.varnish.port
                                      , '-f' + config.varnish.config
                                      , '-s malloc'
                                      , '-n/tmp'
                                      , '-F'
                                      ]);

child.stderr.on('data', function (data) {
  console.log('varnish child process: ' + data);
});

// always kill the child
process.on('exit', function() {
  child.kill()
})
process.on('uncaughtException', function() {
  child.kill()
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
  var stats = varnish.stats();

  var fields = ['client_conn', 'client_req', 'cache_hit', 'cache_miss', 's_sess', 's_req',
                's_pass', 's_fetch', 's_hdrbytes', 's_bodybytes', 'backend_req'];

  for (var i=0; i<fields.length; i++) {
    socket.broadcast(JSON.stringify({ key: fields[i], value: stats[fields[i]] }));
  }
}, 800);

// generate varnish requests from bit.ly urls
twitter.on('message', function (msg) {
  var varnishClient = http.createClient(config.varnish.port, config.varnish.host)
    , request = varnishClient.request('GET', '/' + msg, { host: config.varnish.host })

  varnishClient.on('error', function (err) {});
  request.on('error', function (err) {});
  request.end();
});

// broadcast a dummy event
var requests = {};

// generate varnish traffic
twitter.on('message', function (msg) {
  socket.broadcast(
    JSON.stringify({ key:  'request'
                   , value: { url: msg
                            , status: 200
                            , ip: '127.0.0.1'
                            , city: 'Berlin'
                            , duration: 100
                            }
                   })
  );
});

redisClient.auth(config.redis.password, function(err, authorized) {
  if(err) throw err

  twitter.read();
})
