exports.createStream = function (opts) {
  var ts = new (require('evented-twitter').TwitterStream)(opts.username, opts.password)
    , stream = ts.filter(opts.format, opts.params)
    , emittr = new (require('events').EventEmitter)()


  stream.addListener('error', function(err) {
    console.error(err.mesage)
    console.error(err.stack)
  })
  stream.addListener('ready', function() {
    console.log('Stream ready')

    stream.addListener('complete', function(res) {
      console.log('Stream complete')
      console.dir(res)

      stream.close()
      stream.start()
    })

    stream.addListener('tweet', function(tweet) {
      if(!String(tweet).trim()) return

      try {
          // The result is not parsed for you
          var t = JSON.parse(tweet)

          if(matches = (t.text + ' ').match(/(soundcloud\.com|snd\.sc)\/.*?\s/g)) {
            emittr.emit('urls', matches)
            
            console.dir(matches)
          }
      } catch(e) {
          console.error('\nProblem parsing: ' + tweet)
          console.error(e.message)
          console.error(e.stack)
      }
    })
  })

  stream.start()

  return emittr
}
