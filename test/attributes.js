var fs = require('fs');
var assert = require('assert');
var Data = require('../lib/data/data');
var _ = require('underscore');

var config = JSON.parse(fs.readFileSync(__dirname+ '/../config.json', 'utf-8'));

// Setup Data.Adapter
Data.setAdapter('couch', { url: config.couchdb_url });

var graph = new Data.Graph();

// Objects get validated against their type
function createAttributes() {
  graph.set('/document/testdoc', {
    "type": ["/type/document", "/type/manual"],
    "created_at": new Date(),
    "updated_at": new Date(),
    "name": "foo_bar",
    "creator": "/user/demo",
    
    // Subjects Attribute
    "subjects": [
      {
        "type": "/type/attribute",
        "name": "JavaScript",
        "member_of": "/document/subjects"
      },
      {
        "type": "/type/attribute",
        "name": "Graph DB",
        "member_of": "/document/subjects"
      }
    ]
  });
}



function findAttributesForPropery() {
  console.log('ALL ATTRS');
  graph.fetch({"type|=": "/type/attribute", "member_of": "/document/subjects"}, {}, function(err, g) {
    console.log(g);
  });
}


graph.fetch({"type|=": ["/type/type", "/type/document"]}, {}, function(err) {
  // console.log('jee');
  console.log(graph.toJSON());
  createAttributes();
  console.log('saving...');
  graph.save(function(err, invalidNodes) {
    console.log(err);
    
    findAttributesForPropery();
  });
});