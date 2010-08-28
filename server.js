var http           = require('http')
  , config         = require('./config')
  , io             = require('socket.io')
  , frontend       = new http.Server()
  , frontendStatic = new(require('node-static').Server)('./public')
  , socket         = io.listen(frontend)

frontend.addListener('request', function (req, res) {
  req.addListener('end', function () {
    frontendStatic.serve(req, res)
  });
});

socket.on('connection', function (client) {
  client.broadcast({ announcement: client.sessionId + ' connected' });
});

frontend.listen(config.frontend.port);

// generate events and broadcast to all clients
setInterval(function () { socket.broadcast(new Date()); }, 1000);
