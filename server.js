var url         = require('url')
  , http        = require('http')
  , spawn       = require('child_process').spawn
  , crypto      = require('crypto')
  , io          = require('socket.io')
  , redisClient = require('redis-client').createClient
  , config      = require('./config')
  , statFields  = config.varnish.statFields
  , lastStats   = null
  , varnish     = new(require('./varnish-ext/build/default/varnish').Varnish)('/tmp')
  , frontend    = new(require('http').Server)()
  , staticSrv   = new(require('node-static').Server)('./public')
  , bitly       = new(require('./lib/bitly').Bitly)()
  , twitter     = require('./lib/twitter').createStream()
  , varnishCli  = http.createClient(config.varnish.port, config.varnish.host) 
  , socket      = io.listen(frontend)
  , urlHash     = function(x) { return crypto.createHash('md5').update(x).digest('hex') }

// handle static file requests
frontend
  .on('request', function (req, res) {
    req.on('end', function () {
      staticSrv.serve(req, res)
    })
  })
  .listen(config.frontend.port)

// accepting socket connections and broadcast events
socket
  .on('connection', function (client) {
    client.broadcast({ announcement: client.sessionId + ' connected' })
  })

// generate varnish requests from bit.ly urls
twitter
  .on('urls', function (urls) {
    urls.forEach(function(url) {
      var  request = varnishCli.request('GET', '/' + url, { host: config.varnish.host })

      varnishCli.on('error', function (err) { console.log(err.stack) })
      request.on('error', function (err) { console.log(err.stack) })
      request.end()
    })
  })
  .on('error', function(err) {
    throw err
  })

// generate varnish traffic
varnish
  .on('RxURL', function (tag, fd, spec, url) {
    var pack = { key:  'request'
               , value: { url: ('http:/' + url)
                        , hash: urlHash(url.toString())
                        }
               }

    socket.broadcast(JSON.stringify(pack))
  })

// start twitter streaming
// twitter.read()

// generate stat events and broadcast to all clients
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
}, 1000)

// generate log events and broadcast to all clients
setInterval(function() {
  varnish.listen()
}, 50)
