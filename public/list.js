// doubly linked list

function TopList(table) {
  this.head = null;
  this.table = table;
  this.listLimit = 10;
  this.size = 0;
}

TopList.prototype = {

  inspect: function()  {
    for (var e = this.head; e != null; e = e.next) {
      console.log(e);
    }
  },
  
  repaint: function() {
    var index = 0;
    var node = this.head;
      
    var link = function(url) {
      return "<a href=\"" + url + "\">" + url + "</a>";
    };
    
    var row = function(value) {
      return "<tr class=\"row\"><td>" + value.count + "</td><td>" + link(value.url) + "</td></tr>";
    };
    
    this.table.remove(".row");

    while((node.next != null) && (index <= this.listLimit)) {
      index += 1;
      this.table.append(row(node));
      node = node.next;
    }
  },

  add: function(data) {
    var index = 0;
    var currentNode = null;
      
    var node = {
        url: data.url,
        hash: data.hash,
        count: 1,
        next: null,
        previous: null
    };

    if (this.head === null) {
      this.head = node;
      this.size += 1;

    } else {      
      for (var currentNode = this.head; currentNode.next != null; currentNode = currentNode.next) {
        
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

      if(index < this.listLimit) { this.repaint(); }
      this.size += 1;
      
      node.previous = currentNode;
      currentNode.next = node;        
    }
  }
};
