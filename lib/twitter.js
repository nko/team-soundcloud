var http = require('http')

function Twitter(host, endpoint, auth) {
  this.twitter = http.createClient(80, host)
  this.headers = { Authorization: 'Basic ' + auth, Host: host }
  this.endpoint = endpoint
  this.buffer  = ''
}

Twitter.prototype = new process.EventEmitter()

Twitter.prototype.read = function () {
  var self = this
    , establish = function() {
        var request = self.twitter.request('GET', self.endpoint, self.headers)

        request.addListener('response', function (res) {
          res.setEncoding('utf8')
          res.addListener('data', function (chunk) {
            clearTimeout(self.timeout)

            var index, json

            self.buffer += chunk

            while ((index = self.buffer.indexOf('\r\n')) > -1) {
              json = self.buffer.slice(0, index)
              self.buffer = self.buffer.slice(index + 2)

              if (json.length > 0) {
                try {
                  if (matches = json.match(/bit\.ly\/[a-zA-Z0-9]+/)) {
                    self.emit('message', matches[0])
                  }
                }
                catch (e) {
                  self.emit('error', e)
                }
              }
            }

            self.timeout = setTimeout(function() {
              console.log('timeout triggered')
              establish()
            }, 5000)
          })
          res.on('end', function() {
            console.log('twitter reqest ended')
            establish()
          })
        })
        request.end()
      }

  establish()
}

exports.Twitter = Twitter
