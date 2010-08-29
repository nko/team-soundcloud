var http           = require('http')
  , spawn          = require('child_process').spawn
  , config         = require('./config')
  , io             = require('socket.io')
  , frontend       = new http.Server()
  , frontendStatic = new(require('node-static').Server)('./public')
  , socket         = io.listen(frontend)
  , url            = require('url')
  , Varnish        = require('./varnish-ext/build/default/varnish')
  , twitter        = new(require('./lib/twitter').Twitter)( config.twitter.host
                                                          , config.twitter.endpoint
                                                          , config.twitter.auth
                                                          );
// start a varnish instance
var child = spawn(config.varnish.run, [ '-a' + config.varnish.host + ':' + config.varnish.port
                                      , '-f' + config.varnish.config
                                      , '-smalloc'
                                      , '-n/tmp'
                                      , '-F'
                                      ]);

var varnish = new Varnish.Varnish('/tmp');

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
  var varnish = http.createClient(config.varnish.port, config.varnish.host)
    , request = varnish.request('GET', '/' + msg, { host: config.varnish.host })

  varnish.on('error', function (err) {});
  request.on('error', function (err) {});
  request.end();
});

// broadcast a dummy event
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

twitter.read();
