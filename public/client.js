// time plugin

(function($) {

  $.dashboardTime = function() {
    var now = new Date();
    return now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
  }

  $.fn.timeize = function(selector) {
    this.html($.dashboardTime());
    var that = this;

    setInterval(function() { that.html($.dashboardTime()); }, 1000);
  };

})(jQuery);

// sparkline plugin with google charts

(function($) {

  $.fn.spark = function(selector) {
  };

})(jQuery);


// apply plugins

$(".time").timeize();

// sockets

io.setPath('/Socket.IO/');

if( window.location.toString().match(/localhost/) ) {
  socket = new io.Socket('localhost');
}
else {
  socket = new io.Socket('team-soundcloud.no.de', {port: 80});
}

socket.connect();
socket.on('message', function(data) {
  $('#messages').html(data);
});
