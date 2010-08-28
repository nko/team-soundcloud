var http           = require('http')
  , config         = require('./config')
  , io             = require('socket.io')
  , frontend       = new http.Server()
  , frontendStatic = new(require('node-static').Server)('./public')
  , socket         = io.listen(frontend)
  , url            = require('url')
  , twitter        = new(require('./lib/twitter').Twitter)( config.twitter.host
                                                          , config.twitter.endpoint
                                                          , config.twitter.auth
                                                          );

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
  var d = new Date();
  socket.broadcast(JSON.stringify({ key:  'date', value: d }));
}, 1000);

setInterval(function () {
  var t = new Date().getMilliseconds();
  socket.broadcast(JSON.stringify({ key: 'counter', value: t }));
}, 1223);

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

twitter.read();
