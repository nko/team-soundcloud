// doubly linked list

function TopList(table) {
  this.head = null;
  this.table = table;
  this.listLimit = 10;
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
        previous: null
    };

    if (this.head === null) {
      this.head = node;

    } else {
      currentNode = this.head;

      while (currentNode.next) {
        
        if (currentNode.hash == node.hash) {
          currentNode.count += 1;

          // // remove node from list position
          // currentNode.previous.next = currentNode.next;
          // currentNode.next.previous = currentNode.previous;
          //
          // // find new previous node
          // var shufflePointer = 0
          //
          // while(currentNode.previous && currentNode.previous.count < currentNode.count) {
          //   shufflePointer -= 1;
          // }

          // insert node at new position

          return;
        }

        index += 1;
        currentNode = currentNode.next;
      }

      if(this.listLimit === index) { this.paint() }      
      node.previous = currentNode;
      currentNode.next = node;
    }
  }
};