var http = require('http')

function Bitly() {
  this.client = http.createClient(80, 'bit.ly')
}

Bitly.prototype.expand = function (key, callback) {
  var req = this.client.request('GET', '/' + key, { host: 'bit.ly' })

  req.on('response', function (res) {
    callback(res.headers);
  })

  req.end()
}

Bitly.prototype.expandMoar = function (key, callback) {
  var splitUrl = key.split('/')

  if( splitUrl.length == 2 ) {
    this.expand(splitUrl[1], callback)
  }
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