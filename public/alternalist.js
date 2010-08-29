function prettyUrl(url) {
  var clean = url.replace(/http:\/\/|https:\/\//, '').replace(/^www\./, '')
    , host = clean.split(/[\/|?|;]/, 1).pop()
    , path = clean.substr(host.length, clean.length);

  return { host: host, path: path };
}

function Alternalist(domElement) {
  this.domElement = domElement;
  this.buckets = {};
  this.counts = {};
  this.max = 1;
}

Alternalist.prototype.bucket = function(key) {
  this.counts[key] = isNaN(this.counts[key]) ? 1 : this.counts[key] + 1;
  if( this.counts[key] > this.max ) { this.max = this.counts[key] }
  return this.counts[key];
}

Alternalist.prototype.add = function (key, value) {
  var key = key.lastIndexOf('/') === (key.length - 1) ? key.substr(0, key.length -1) : key
    , bucket = this.bucket(key), index;

  if( this.buckets[bucket - 1] ) {
    index = this.buckets[bucket-1].indexOf(key);
    if( index !== -1 ) {
      delete this.buckets[bucket - 1][index];
    }
  }

  if( this.buckets[bucket] === undefined ) { this.buckets[bucket] = []; }
  this.buckets[bucket].push(key);
}

Alternalist.prototype.topk = function (k) {
  var elements = [];

  for (var i=this.max; i>0; i--) {
    for (var j=0; j<this.buckets[i].length; j++) {
      if (this.buckets[i][j]) {
        elements.push({ count: i, url: this.buckets[i][j] });
        if (elements.length == k) {
          return elements;
        }
      }
    }
  }

  return elements;
}

Alternalist.prototype.paint = function (k) {
  var lines = this.topk(50);

  var link = function(url) {
    var pretty = prettyUrl(url);

    return '<a href=\'' + url + '\'><span class="host">' + pretty.host + '</span><span class="path">' + pretty.path + '</span></a>';
  };

  var row = function(count, url) {
    return '<tr class=\'row\'><td>' + count + '</td><td>' + link(url) + '</td></tr>';
  };

  this.domElement.empty();

  for(var i=0; i<lines.length; i++) {
    this.domElement.append(row(lines[i].count, lines[i].url));
  }
}
