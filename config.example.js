var path = require('path')

exports.root = root = path.dirname(__filename)
exports.frontend = { port: 8080 }

// redis host, port, auth
exports.redis = { host: 'foo.bar.baz'
                , port: 6379
                , password: '1234'
                }

// twitter api details + auth credentials
exports.twitter = { host: 'stream.twitter.com'
                  , endpoint: '/1/statuses/filter.json?track=bit'
                  , auth: 'foo' // Base64.encode64(username:password)
                  }

// host + url that can be used to generate traffic against varnish
exports.varnish = { run: '/usr/local/sbin/varnishd'
                  , config: path.join(root, '/config/varnish.dev.conf')
                  , host: '127.0.0.1'
                  , port: 9000
                  }
