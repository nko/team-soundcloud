list = new TopList($("table"));

test('head()', function() {
  url = { url: "http://test.com", hash: "123" };
  list.add(url);
  
 ok(list.head.url == url.url, 'Should not insert duplicate');
})

test('add()', function() {
  url = { url: "http://test.com", hash: "123" };
  list.add(url);
  list.add(url);
  list.add(url);
    
  ok(list.size == 1, 'Should not insert duplicate');
  list.inspect();    
})


test('add()', function() {
  url = { url: "http://test.com", hash: "123" };
  list.add(url);
  list.add(url);
  list.add(url);
  
  ok(list.size == 1, 'Should not insert duplicate');
})
