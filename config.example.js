var path = require('path')

exports.root    = path.dirname(__filename)
exports.webroot = path.join(root, 'public')

exports.frontend = { port: 8080 }
