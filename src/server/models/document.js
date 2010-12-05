var _ = require('underscore');

// Document Model
// -----------


// Create Data.Graph of documents

function createGraph(documents) {
  var result = {
    "/type/document": {
      "type": "type",
      "name": "Document",
      "properties": {
        "id": {
          "name": "Document Id",
          "unique": true,
          "expected_type": "string"          
        },
        "name": {
          "name": "Unique name",
          "unique": true,
          "expected_type": "string"          
        },
        "author": {
          "name": "Author",
          "unique": true,
          "expected_type": "string"
        },
        "title": {
          "name": "Document Title",
          "unique": true,
          "expected_type": "string"
        }
      }
    }
  };
  
  // Append document attributes as properties
  _.each(config.settings.attributes, function(attr) {
    result["/type/document"].properties[attr.key] = {
      "name": attr.name,
      "unique": attr.unique,
      "expected_type": attr.type
    };
  });
  
  // Add registered documents to the output
  _.each(documents, function(doc) {
    result[doc.id] = {
      type: '/type/document',
      id: doc.id,
      name: doc.name,
      title: doc.title,
      author: doc.author
    };
    
    // Iterate over document attributes
    _.each(config.settings.attributes, function(attr) {
      var val = doc.attributes ? doc.attributes[attr.key] : undefined;
      var def = attr['default'] ? _.clone(attr['default']) : null;
      
      result[doc.id][attr.key] = val ? val : def;
    });
  });
  return result;
};

var Document = {};

_.extend(Document, {
  all: function(options) {
    db.view('substance/documents', function (err, documents) {
      if (err) {
        options.error(err);
        return;
      }

      var result = documents.map(function(d) {
        return {
          id: d.id,
          title: d.title,
          author: d.author,
          name: d.name,
          attributes: d.attributes
        };
      });
      options.success(JSON.parse(JSON.stringify(result)));
    });
  },
  
  allAsGraph: function(options) {
    Document.all({
      withContents: true,
      success: function(documents) {
        var result = createGraph(documents);
        options.success(result);
      },
      error: function(msg) {
        options.error(msg);
      }
    });
  },

  get: function(id, options) {
    db.get(id, function (err, doc) {
      if (!err) {
        var result = _.extend(doc.contents, {
          id: id,
          author: doc.author,
          name: doc.name
        });        
        options.success(JSON.parse(JSON.stringify(result)));
      } else {
        options.error(err)
      }
    });
  },

  create: function(username, name, doc, options) {
    if (username.length>0 && name.length>0) {
      db.save('users:'+username+':documents:'+name, {
        author: username,
        name: name,
        contents: doc,
        type: 'document'
      }, function (err, result) {
        err ? options.error(err) : options.success();
      });
    } else {
      options.error('Document name missing');
    }
  },

  update: function(username, name, doc, options) {
    var id = 'users:'+username+':documents:'+name;
    db.get(id, function (err, prevdoc) {
      db.save(id, prevdoc.rev, {
        contents: doc,
        author: username,
        name: name,
        type: 'document'
      }, function (err, result) {
        err ? options.error(err) : options.success();
      });
    });
  },

  destroy: function(id, options) {
    db.get(id, function (err, prevdoc) {
      db.remove(id, prevdoc.rev, function (err, result) {
        options.success();
      });
    });
  }
});
  
module.exports = Document;
