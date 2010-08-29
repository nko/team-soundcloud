function TopList(table) {
  this.head = null;
  this.table = table;
}

TopList.prototype = {

  paint: function() {
    var node = this.head;
    var link = function(url) {
      return "<a href=\"http://" + url + "\">http://" + url + "</a>"
    }

    var row = function(value) {
      return "<tr><td>" + link(value.url) + "</td></tr>";
    }

    while(node.next) {
      this.table.append(row(node));
      node = node.next
    }
  },

  add: function(data) {
    var currentNode;
    var node = {
        url: data.url,
        hash: data.hash,
        count: 1,
        next: null
    };

    if (this.head === null) {
      this.head = node;

    } else {
      currentNode = this.head;

      while (currentNode.next || currentNode == this.head) {
        if (currentNode.hash == node.hash) {
          currentNode.count += 1;

          // move.

          return;
        }

        currentNode = currentNode.next;
      }

      currentNode.next = node;
    }
  }
};