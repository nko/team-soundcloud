function TopList(table) {
  this.head = null;
  this.table = table;
  this.listLimit = 100;
}

TopList.prototype = {

  paint: function() {
    var index = 0
      , node = this.head;
      
      var link = function(url) {
      return "<a href=\"http://" + url + "\">http://" + url + "</a>"
    }

    var row = function(value) {
      return "<tr><td>" + value.count + "</td><td>" + link(value.url) + "</td></tr>";
    }

    while(node.next && index < this.listLimit) {
      index += 1;
      
      this.table.append(row(node));
      node = node.next;
    }
  },

  add: function(data) {
    var index = 0
      , currentNode;
      
    var node = {
        url: data.url,
        hash: data.url,
        count: 1,
        next: null
    };

    if (this.head === null) {
      this.head = node;

    } else {
      currentNode = this.head;

      while (currentNode.next) {
        
        if (currentNode.hash == node.hash) {
          currentNode.count += 1;

          // move.

          return;
        }

        index += 1;
        currentNode = currentNode.next;
      }

      if(this.listLimit === index) { this.paint() }      
      currentNode.next = node;
    }
  }
};