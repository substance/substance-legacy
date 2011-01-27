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
    "document_types": ["/type/qaa", "/type/manual", "/type/article"],
    "allow_user_registration": true
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
      "name": {
        "name": "Name",
        "unique": true,
        "type": "string",
        "required": true
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
  
  
  // Attribute
  // --------------------
  
  "/type/attribute": {
    "_id": "/type/attribute",
    "type": "/type/type",
    "name": "Attribute",
    "properties": {
      "name": {
        "name": "Attribute Value",
        "unique": true,
        "type": "string",
        "required": true
      },
      "member_of": {
        "name": "Member of Property",
        "unique": true,
        "type": "string",
        "required": true,
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
        "validator": "^[a-zA-Z_0-9]{1}[a-zA-Z_0-9-]{2,40}$"
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
      "subjects": {
        "type": ["/type/attribute"],
        "name": "Subjects",
        "unique": false,
        "default": [],
        "meta": {
          "facet": true
        }
      }
    }
  },
  
  // Schema for Conversation

  "/type/qaa": {
    "type": "/type/type",
    "name": "Q&A",
    "properties": {
      "children": {
        "name": "Children/Contents",
        "unique": false,
        "type": ["/type/question", "/type/answer"],
        "default": []
      }
    },
    "meta": {
      "template": {
        "type": ["/type/document", "/type/qaa"]
      }
    }
  },

  // Schema for Manual

  "/type/manual": {
    "type": "/type/type",
    "name": "Manual",
    "properties": {
      "children": {
        "name": "Children/Contents",
        "unique": false,
        "type": ["/type/section"],
        "default": []
      }
    },
    "meta": {
      "template": {
        "type": ["/type/document", "/type/manual"]
      }
    }
  },
  
  // Schema for Article

  "/type/article": {
    "type": "/type/type",
    "name": "Article",
    "properties": {
      "children": {
        "name": "Children/Contents",
        "unique": false,
        "type": ["/type/section"],
        "default": []
      }
    },
    "meta": {
      "template": {
        "type": ["/type/document", "/type/article"]
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
      "document": {
        "name": "Document Membership",
        "unique": true,
        "required": true,
        "type": ["/type/document"]
      },
      "children": {
        "name": "Children",
        "unique": false,
        "type": ["/type/text", "/type/quote", "/type/code", "/type/visualization"],
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
      },
      "document": {
        "name": "Document Membership",
        "unique": true,
        "required": true,
        "type": ["/type/document"]
      }
    }
  },
  
  // Visualization
  // --------------------
  
  "/type/visualization": {
    "_id": "/type/visualization",
    "type": "/type/type",
    "name": "Visualization",
    "properties": {
      "data_source": {
        "name": "Data Source",
        "unique": true,
        "type": "string",
        "required": true,
        "default": "http://dejavis.org/files/linechart/data/countries.json",
      },
      "visualization_type": {
        "name": "Visualization Type",
        "unique": true,
        "type": "string",
        "required": true,
        "default": "linechart"
      },
      "document": {
        "name": "Document Membership",
        "unique": true,
        "required": true,
        "type": ["/type/document"]
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
      },
      "document": {
        "name": "Document Membership",
        "unique": true,
        "required": true,
        "type": ["/type/document"]
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
      },
      "document": {
        "name": "Document Membership",
        "unique": true,
        "required": true,
        "type": ["/type/document"]
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
      },
      "document": {
        "name": "Document Membership",
        "unique": true,
        "required": true,
        "type": ["/type/document"]
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
      },
      "document": {
        "name": "Document Membership",
        "unique": true,
        "required": true,
        "type": ["/type/document"]
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
      },
      "document": {
        "name": "Document Membership",
        "unique": true,
        "required": true,
        "type": ["/type/document"]
      }
    }
  },
  
  // Example User
  // --------------------
  
  "/user/demo": {
    "type": "/type/user",
    "username": "demo",
    "name": "Demo User",
    "email": "demo@substance.io",
    "password": "demo",
    "firstname": "Demo",
    "lastname": "User"
  }
};


var graph = new Data.Graph(seedGraph, true);

if (process.argv[2] == "--flush") {
  Data.adapter.flush(function(err) {
    console.log('DB Flushed.');
    err ? console.log(err)
        : graph.sync(function(err, invalidNodes) {
          console.log('invalidNodes:');
          if (invalidNodes) console.log(invalidNodes.keys());
          
          err ? console.log(err)
              : console.log('Couch seeded successfully.\nStart the server: $ node server.js');
        });
  });
} else {
  graph.sync(function(err, invalidNodes) {
    console.log('invalidNodes:');
    if (invalidNodes) console.log(invalidNodes.keys());
    err ? console.log(err)
        : console.log('Couch seeded successfully.\nStart the server: $ node server.js');
  });
}
