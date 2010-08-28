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
    
    return this;
  };

})(jQuery);

// websocket plugin

(function($) {

  $.fn.websocks = function(selector) {
    
    this.each(function() {
      var element = $(this);
      
      io.setPath('/Socket.IO/');

      if( window.location.toString().match(/localhost/) ) {
        socket = new io.Socket('localhost');
        
      } else {
        socket = new io.Socket('team-soundcloud.no.de', {port: 80});
        
      }

      socket.connect();
      socket.on(element.attr('data-websock-filter'), function(data) {
        element.html(data);
      });
    });
    
    return this;
  };

})(jQuery);

// sparkline plugin with google charts

(function($) {

  $.fn.spark = function(selector) {
    return this;
  };

})(jQuery);

// apply plugins

$(".time").timeize();
$('.messages').websocks();