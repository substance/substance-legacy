var fs = require('fs');
var assert = require('assert');
var Data = require('../lib/data');
var _ = require('underscore');

var config = JSON.parse(fs.readFileSync(__dirname+ '/../config.json', 'utf-8'));

// Setup Data.Adapter
Data.setAdapter('couch', { url: 'http://localhost:5984/test' });

// Our Domain Model with some sample data
var seedGraph = {
  
  // User
  // --------------------
  
  "/type/user": {
    "_id": "/type/user",
    "type": "/type/type",
    "name": "User",
    "properties": {
      "username": {
        "name": "Username",
        "unique": true,
        "type": "string",
        "required": true,
        "validator": "^[a-z_]{1}[a-z_0-9]{2,20}$"
      },
      "email": {
        "name": "Email",
        "unique": true,
        "type": "string",
        "required": true,
        "validator": "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,6}$"
      },
      "password": {
        "name": "Password",
        "unique": true,
        "type": "string",
        "required": true,
        "validator": "^\\w{4,}$"
      },
      "firstname": {
        "name": "Firstname",
        "unique": true,
        "type": "string"
      },
      "lastname": {
        "name": "Lastname",
        "unique": true,
        "type": "string"
      }
    }
  },
  
  
  // Document
  // --------------------
  
  "/type/document": {
    "_id": "/type/document",
    "type": "/type/type",
    "name": "Document",
    "properties": {
      "name": {
        "name": "Internal name",
        "unique": true,
        "type": "string",
        "required": true,
        "validator": "^[a-z_]{1}[a-z_0-9]{2,20}$"
      },
      "title": {
        "name": "Document Title",
        "unique": true,
        "type": "string",
        "default": "Untitled"
      },
      "lead": {
        "name": "Lead",
        "unique": true,
        "type": "string",
        "default": "Document's lead"
      },
      "creator": {
        "name": "Creator",
        "unique": true,
        "type": "/type/user",
        "required": true,
        "meta": {
          "facet": true
        }
      },
      "children": {
        "name": "Sections",
        "unique": false,
        "type": "/type/section",
        "default": []
      },
      "created_at": {
        "name": "Created at",
        "unique": true,
        "type": "date",
        "required": true
      },
      "updated_at": {
        "name": "Last modified",
        "unique": true,
        "type": "date",
        "required": true
      },
      "published_on": {
        "name": "Publication Date",
        "unique": true,
        "type": "date"
      },
      "topics": {
        "name": "Topics",
        "unique": false,
        "type": "string",
        "default": [],
        "meta": {
          "facet": true,
          "attribute": true
        }
      },
      "keywords": {
        "name": "Keywords",
        "unique": false,
        "type": "string",
        "default": [],
        "meta": {
          "facet": true,
          "attribute": true
        }
      }
    }
  },
  
  
  // Section
  // --------------------
  
  "/type/section": {
    "_id": "/type/section",
    "type": "/type/type",
    "name": "Section",
    "properties": {
      "name": {
        "name": "Name",
        "unique": true,
        "type": "string",
        "default": "A new header"
      },
      "children": {
        "name": "Children",
        "unique": false,
        "type": ["/type/text", "/type/image", "/type/quote", "/type/code"],
        "default": []
      }
    }
  },
  
  // Text
  // --------------------
  
  "/type/text": {
    "_id": "/type/text",
    "type": "/type/type",
    "name": "Text",
    "properties": {
      "content": {
        "name": "Content",
        "unique": true,
        "type": "string",
        "default": "<p>Some text ...</p>"
      }
    }
  },
  
  // Quote
  // --------------------
  
  "/type/quote": {
    "_id": "/type/quote",
    "type": "/type/type",
    "name": "Quote",
    "properties": {
      "content": {
        "name": "Content",
        "unique": true,
        "type": "string",
        "default": "A famous quotation"
      }
    }
  },
  
  
  // Code
  // --------------------
  
  "/type/code": {
    "_id": "/type/code",
    "type": "/type/type",
    "name": "Code",
    "properties": {
      "content": {
        "name": "Content",
        "unique": true,
        "type": "string",
        "default": "var foo = new Foo();"
      }
    }
  },
  
  // Image
  // --------------------
  
  "/type/image": {
    "_id": "/type/image",
    "type": "/type/type",
    "name": "Image",
    "properties": {
      "title": {
        "name": "Image Title",
        "unique": true,
        "type": "string",
      },
      "url": {
        "name": "Image URL",
        "unique": true,
        "type": "string"
      }
    }
  },
  
  // Example User
  // --------------------
  
  "/user/demo": {
    "type": "/type/user",
    "username": "demo",
    "email": "demo@substance.io",
    "password": "demo",
    "firstname": "Demo",
    "lastname": "User"
  }
};



function addExampleDoc() {
  var doc = graph.set(Data.uuid('/document/demo/'), {
    "type": "/type/document",
    "title": "Untitled",
    "creator": "/user/demo",
    "created_at": new Date(),
    "updated_at": new Date(),
    "published_on": new Date(), // a published document
    "name": "foo_doc",
    "children": [
    
      // Section 1
      {
        "type": "/type/section",
        "name": "Section 1",
        "children": []
      },
      
      // Section 2
      {
        "type": "/type/section",
        "name": "Section 2",
        "children": [
        
          // Text 1
          {
            "type": "/type/text",
            "content": "Some text"
          },
          
          // Text 2
          {
            "type": "/type/text",
            "content": "Another text"            
          }
        ]
      }
    ]
  });
  
  return doc;
};


var graph = new Data.Graph(seedGraph);
addExampleDoc();

Data.adapter.flush(function(err) {  

  err ? console.log(err)
      : graph.save(function(err, invalidNodes) {
        console.log('Seeded. Now querying....');
        
        graph.fetch({"type": "/type/document", "published_on": null}, {}, function(err, g) {
          console.log(err);
          console.log(g);
        });
      });
});