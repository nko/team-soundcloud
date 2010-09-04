var path = require('path')

exports.root = root = path.dirname(__filename)
exports.frontend = { port: 8080 }

// redis host, port, auth
exports.redis = { host: 'foo.bar.baz'
                , port: 6379
                , password: '1234'
                }

// twitter api details + auth credentials
exports.twitter = { username: 'foo'
                  , password: 'bar'
                  , format: 'json'
                  , params: { track: 'foo,bar' }
                  }

// host + url that can be used to generate traffic against varnish
exports.varnish = { run: '/usr/local/sbin/varnishd'
                  , config: path.join(root, '/config/varnish.dev.conf')
                  , host: '127.0.0.1'
                  , port: 9000
                  , statFields: [ 'client_conn'
                                , 'client_req'
                                , 'cache_hit'
                                , 'cache_miss'
                                , 's_sess'
                                , 's_req'
                                , 's_pass'
                                , 's_fetch'
                                , 'backend_req'
                                ]
                  }
