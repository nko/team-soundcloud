var http = require('http')

function Twitter(host, endpoint, auth) {
  this.twitter = http.createClient(80, host);
  this.headers = { Authorization: 'Basic ' + auth, Host: host }
  this.request = this.twitter.request('GET', endpoint, this.headers);
  this.buffer  = '';
}

Twitter.prototype = new process.EventEmitter();

Twitter.prototype.read = function () {
  var self = this;
  this.request.addListener('response', function (res) {
    res.setEncoding('utf8');
    res.addListener('data', function (chunk) {
      var index, json;
      self.buffer += chunk;
      while ((index = self.buffer.indexOf('\r\n')) > -1) {
        json = self.buffer.slice(0, index);
        self.buffer = self.buffer.slice(index + 2);
        if (json.length > 0) {
          try {
            if (matches = json.match(/bit\.ly\/[a-zA-Z0-9]+/)) {
              self.emit('message', matches[0]);
            }
          }
          catch (error) {
            self.emit('error');
          }
        }
      }
    });
  });
  this.request.end();
}

exports.Twitter = Twitter;
