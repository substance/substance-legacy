require('underscore');

// Document Model
// -----------

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

  get: function(id, options) {
    db.get(id, function (err, doc) {
      if (!err) {
        var result = _.extend(doc.contents, {
          id: doc._id,
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
    db.save('users:'+username+':documents:'+name, {
      author: username,
      name: name,
      contents: doc,
      type: 'document'
    }, function (err, result) {
      err ? options.error(err) : options.success();
    });
  },

  update: function(id, doc, options) {
    db.get(id, function (err, prevdoc) {
      db.save(id, prevdoc.rev, {contents: doc, type: 'document'}, function (err, result) {
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
