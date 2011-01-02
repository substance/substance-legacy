var fs = require('fs');
var assert = require('assert');
var Data = require('../lib/data');
var _ = require('underscore');

// Setup Data.Adapter
Data.setAdapter('couch', { url: 'http://localhost:5984/substance' });


// Objects get validated against their type
function testObjectValidation() {
  // Create a new object and validate it
  var doc = graph.set(null, {
    type: "/type/document",
    title: 123, // wrong type, should be string!
    children: [
      {
        type: "/type/text" // wrong type! should cause an validation error
      }
    ]
  });
  
  // wrong type for title/children, missing name, creator, created_at, updated_at
  assert.ok(!doc.validate());
  assert.ok(doc.errors.length === 6);
  
  doc.set({
    name: "example_doc",
    title: "Hello world",
    created_at: new Date(),
    updated_at: new Date(),
    creator: "/user/demo",
    children: [
      {
        type: "/type/section",
        name: "Foo"
      }
    ]
  });
  
  assert.ok(doc.validate()); // should work now
  assert.ok(doc.errors.length === 0);
  
  var user = graph.set(null, {
    type: '/type/user',
    username: 'john',
    password: 'test',
    email: 'invalid@@.email/.com'
  });

  user.validate();
  assert.ok(user.errors.length === 1);

  graph.save(function(err, invalidNodes) {
    assert.ok(invalidNodes.length === 1)
    
    user.set({
      email: "valid@email.com"
    });

    user.validate();
    assert.ok(user.errors.length === 0);
  });
}

var graph = new Data.Graph();

graph.fetch({type: "/type/type"}, {}, function(err) {
  graph.fetch({type: "/type/user"}, {}, function(err) {  
    testObjectValidation();
    console.log('All tests completed.')
  });
});