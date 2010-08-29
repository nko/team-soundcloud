var path = require('path')

exports.root    = path.dirname(__filename)

exports.frontend = { port: 8080 }

// twitter api details + auth credentials
exports.twitter = { host: 'stream.twitter.com'
                  , endpoint: '/1/statuses/filter.json?track=bit'
                  , auth: 'foo' // Base64.encode64(username:password)
                  }

// host + url that can be used to generate traffic against varnish
exports.varnish = { run: '/usr/local/sbin/varnishd'
                  , config: path.dirname(__filename) + '/config/varnish.dev.conf'
                  , host: '127.0.0.1'
                  , port: 9000
                  }
