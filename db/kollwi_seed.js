var fs = require('fs');
var assert = require('assert');
var Data = require('../lib/data/data');
var _ = require('underscore');

var config = JSON.parse(fs.readFileSync(__dirname+ '/../config.json', 'utf-8'));

// Setup Data.Adapter
Data.setAdapter('couch', { url: config.couchdb_url });

// Our Domain Model with some sample data
var seedGraph = {
  
  // Application Configuration Type
  // --------------------
  
  "/type/config": {
    "_id": "/type/config",
    "type": "/type/type",
    "name": "Configuration",
    "properties": {
      "theme": {
        "name": "Theme",
        "type": "string",
        "unique": true,
        "required": true,
        "default": "default"
      },
      "allow_user_registration": {
        "name": "Allow User registration",
        "type": "boolean",
        "unique": true,
        "default": true
      },
      "document_types": {
        "name": "Supported Document Types",
        "type": "string",
        "unique": false,
        "required": false
      }
    }
  },
  
  // Substance Configuration
  // --------------------
  
  "/config/substance": {
    "type": "/type/config",
    "theme": "default",
    "document_types": ["/type/story", "/type/conversation"],
    "allow_user_registration": false
  },
  
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
      "keywords": {
        "name": "Schlüsselwörter",
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
  
  
  // Schema for Conversation

  "/type/conversation": {
    "type": "/type/type",
    "name": "Conversation",
    "properties": {
      "children": {
        "name": "Children/Contents",
        "unique": false,
        "type": ["/type/question", "/type/answer"]
      }
    },
    "meta": {
      "template": {
        "type": ["/type/document", "/type/conversation"],
        "children": [
          {
            "type": "/type/question"
          },
          {
            "type": "/type/answer"
          }
        ]
      }
    }
  },

  // Schema for Story

  "/type/story": {
    "type": "/type/type",
    "name": "Story",
    "properties": {
      "name": {
        "name": "Name",
        "unique": true,
        "type": "string"
      },
      "children": {
        "name": "Children/Contents",
        "unique": false,
        "type": ["/type/section"]
      }      
    },
    "meta": {
      "template": {
        "type": ["/type/document", "/type/story"],
        "children": [
          {
            "type": "/type/section",
            "name": "First section"
          }
        ]
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
        "type": ["/type/text", "/type/quote"],
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
  
  
  // Question
  // --------------------
  
  "/type/question": {
    "_id": "/type/question",
    "type": "/type/type",
    "name": "Text",
    "properties": {
      "content": {
        "name": "Content",
        "unique": true,
        "type": "string",
        "default": "Question?"
      }
    }
  },
  
  // Answer
  // --------------------
  
  "/type/answer": {
    "_id": "/type/answer",
    "type": "/type/type",
    "name": "Answer",
    "properties": {
      "content": {
        "name": "Content",
        "unique": true,
        "type": "string",
        "default": "Answer."
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
        "default": "var foo = new Bar();"
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


var graph = new Data.Graph(seedGraph);

if (process.argv[2] == "--flush") {
  Data.adapter.flush(function(err) {
    console.log('DB Flushed.');
    err ? console.log(err)
        : graph.save(function(err, invalidNodes) {
          console.log('invalidNodes:');
          if (invalidNodes) console.log(invalidNodes.keys());
          
          err ? console.log(err)
              : console.log('Couch seeded successfully.\nStart the server: $ node server.js');
        });
  });
} else {
  graph.save(function(err, invalidNodes) {
    console.log('invalidNodes:');
    if (invalidNodes) console.log(invalidNodes.keys());
    err ? console.log(err)
        : console.log('Couch seeded successfully.\nStart the server: $ node server.js');
  });
}
