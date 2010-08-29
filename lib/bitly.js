var url = require('url')
  , http = require('http')

function Bitly() {
  this.client = http.createClient(80, 'bit.ly')
}

Bitly.prototype.expand = function (key, callback) {
  var req = this.client.request('GET', '/' + key, { host: 'bit.ly' })

  req.on('response', function (res) {
    callback((res.statusCode < 400), res.headers);
  })

  req.end()
}

Bitly.prototype.expandMoar = function (input, callback) {
  this.expand(url.parse(input).pathname.substr(1), callback)
}

exports.Bitly = Bitly
/*

var bitly = new Bitly()

bitly.expand('cHSOQi', function(data) {
  console.log(data)
})

bitly.expandMoar('bit.ly/cHSOQi', function(data) {
  console.log(data)
})

*/
