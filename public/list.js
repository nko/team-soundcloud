// doubly linked list

function TopList(table) {
  this.head = null;
  this.table = table;
  this.listLimit = 10;
}

TopList.prototype = {

  repaint: function() {
    console.log("repainting");

    var index = 0
      , node = this.head;
      
      var link = function(url) {
      return "<a href=\"" + url + "\">" + url + "</a>"
    }

    var row = function(value) {
      return "<tr class=\"row\"><td>" + value.count + "</td><td>" + link(value.url) + "</td></tr>";
    }

    this.table.remove(".row");

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
        next: null,
        previous: null
    };

    if (this.head === null) {
      this.head = node;

    } else {
      currentNode = this.head;

      while (currentNode.next) {
        if (currentNode.hash == node.hash) {
          console.log(currentNode.hash + ' is ' + node.hash);
        }

        if (currentNode.hash == node.hash) {
          currentNode.count += 1;

          // remove node from list position
          if (currentNode.previous) {
            currentNode.previous.next = currentNode.next;
          }

          if (currentNode.next) {
            currentNode.next.previous = currentNode.previous;
          }

          // traverse back up
          while ( (currentNode.previous != null) && (currentNode.previous.count < currentNode.count) ) {
            currentNode = currentNode.previous;
          }

          // insert node at new position
          node.next = currentNode.next;
          node.previous = currentNode;

          this.repaint();

          return;
        }

        index += 1;
        currentNode = currentNode.next;
      }

      if(index < this.listLimit) { this.repaint(); }

      node.previous = currentNode;
      currentNode.next = node;
    }
  }
};
