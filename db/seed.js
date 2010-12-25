// Testsuite covering the usecases of Substance
// -------------------
// 
// See http://github.com/michael/substance

var fs = require('fs');
var assert = require('assert');
var Data = require('../lib/data');
var _ = require('underscore');
var async = require('async');


// Setup Data.Adapter
Data.setAdapter('couch', { url: 'http://localhost:5984/substance' });

// Our Domain Model with some sample data

var seedGraph = {
  
  // User
  // --------------------
  
  "/type/user": {
    "_id": "/type/user",
    "type": "/type/type",
    "properties": {
      "username": {
        "name": "Username",
        "unique": true,
        "expected_type": "string",
      },
      "email": {
        "name": "Email",
        "unique": true,
        "expected_type": "string",
      },
      "password": {
        "name": "Password",
        "unique": true,
        "expected_type": "string",
      },
      "firstname": {
        "name": "Firstname",
        "unique": true,
        "expected_type": "string"
      },
      "lastname": {
        "name": "Lastname",
        "unique": true,
        "expected_type": "string"
      }
    }
  },
  
  
  // Document
  // --------------------
  
  "/type/document": {
    "_id": "/type/document",
    "type": "/type/type",
    "properties": {
      "name": {
        "name": "Internal name",
        "unique": true,
        "expected_type": "string"
      },
      "title": {
        "name": "Document Title",
        "unique": true,
        "expected_type": "string"
      },
      "user": {
        "name": "User",
        "unique": true,
        "expected_type": "/type/user"
      },
      "children": {
        "name": "Sections",
        "unique": false,
        "expected_type": "/type/section"
      },
      "created_at": {
        "name": "Created at",
        "unique": false,
        "expected_type": "date"
      },
      "updated_at": {
        "name": "Last modified",
        "unique": false,
        "expected_type": "date"
      },
      "published_on": {
        "name": "Publication Date",
        "unique": false,
        "expected_type": "date"
      }
    }
  },
  
  
  // Section
  // --------------------
  
  "/type/section": {
    "_id": "/type/section",
    "type": "/type/type",
    "properties": {
      "name": {
        "name": "Name",
        "unique": true,
        "expected_type": "string"
      },
      "children": {
        "name": "Children",
        "unique": false,
        "expected_type": "/type/text" // ["/type/text", "/type/image", "/type/quote"]
      }
    }
  },
  
  // Text
  // --------------------
  
  "/type/text": {
    "_id": "/type/text",
    "type": "/type/type",
    "properties": {
      "content": {
        "name": "Content",
        "unique": true,
        "expected_type": "string",
      }
    }
  },
  
  // Image
  // --------------------
  
  "/type/image": {
    "_id": "/type/image",
    "type": "/type/type",
    "properties": {
      "title": {
        "name": "Image Title",
        "unique": true,
        "expected_type": "string",
      },
      "url": {
        "name": "Image URL",
        "unique": true,
        "expected_type": "string"
      }
    }
  },
  
  // Example User
  // --------------------
  
  "/user/michael": {
    "type": "/type/user",
    "username": "michael",
    "email": "email@domain.com",
    "firstname": "Michael",
    "lastname": "Aufreiter"
  },
  
  // Example Document
  // --------------------
  
  "/document/example": {
    "title": "Example Document",
    "type": "/type/document",
    "user": "/user/michael", // references the user object
    "children": ["/section/1", "/section/2"]
  },
  
  "/section/1": {
    "type": "/type/section",
    "name": "Section 1",
    "children": ["/text/1"]
  },
  
  "/section/2": {
    "type": "/type/section",
    "name": "Section 1",
    "children": ["/text/2"]
  },
  
  "/text/1": {
    "type": "/type/text",
    "content": "Some text"
  },
  
  "/text/2": {
    "type": "/type/text",
    "content": "Some text"
  }
};



var graph = new Data.Graph(seedGraph);
var doc, user;

function storeSchema(callback) {
  graph.save(function(err) {
    err ? callback(err) : callback();
  });
};

function createDocument(callback) {
  var id = '/document/substance';
  
  // Setup a user first
  user = graph.set('/user/michael', {
    username: 'michael',
    email: 'email@domain.com',
    firstname: 'Michael',
    lastname: 'Aufreiter'
  });
  
  // Add a document
  doc = graph.set(id, {
    title: 'Document authoring with Substance',
    user: "/user/michael", // references the user object
    children: []
  });
  
  // Section 3
  section3 = graph.set('/section/3', {
    name: 'Section 3',
    children: []
  });
  
  // Text 3
  text3 = graph.set('/text/3', {
    content: 'WOOHOO',
  });
  
  // Set Attributes on an existing object
  doc.set({
    'name': 'test'
  });
  
  assert.ok(doc.get('title') === 'Document authoring with Substance');  
  assert.ok(doc.get('user').get('email') === 'email@domain.com');
  assert.ok(doc.get('user').get('firstname') === 'Michael');
  assert.ok(doc.get('user').get('lastname') === 'Aufreiter');

  callback();
};


function addSections(callback) {
  
  doc.set({
    'children': ['/section/1', '/section/2']
  });
  
  // Setting properties overrides old properties
  // doc.set({
  //   'children': ['/section/3']
  // });
  
  // Insert section at a certain position
  doc.get('children').set('/section/3', doc.newReference('/section/3'), 1);
  
  // Insert /section/1.1 before /section/2
  // doc.setAfter('children', '/section')
  
  console.log(doc.get('children').keys());
  
  callback();
};


// Tests are run sequentially as they depend on each other
async.waterfall([
  Data.adapter.flush,
  storeSchema,
  createDocument,
  addSections,
], function(err) {
  console.log('Testsuite passed.');
});
