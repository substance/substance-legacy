var _ = require('underscore');
var async = require('async');
var Data = require('../../lib/data/data');
var sanitize = require('./sanitize').sanitize;

// Util
// -----------

// There's a duplicate version in document.js
function isAuthorized(node, username, callback) {
  if ("/user/"+username === node.creator) return callback(null);
  // Fetch list of collaborators
  this.db.view('substance/collaborators', {key: ["/user/"+username, node._id]}, function(err, res) {
    res.rows.length > 0 && res.rows[0].value.mode === "edit" ? callback(null) : callback({error: "unauthorized"});
  });
}

// Middleware for graph read and write operations
// -----------

var Filters = {};
Filters.ensureAuthorized = function() {
  return {
    read: function(node, next, session) {
      // Hide all password properties
      delete node.password;
      
      // Secure unpublished documents
      if (_.include(node.type, "/type/document") && !node.published_on) {
        // isAuthorized(node, session.username, function(err) {
        //   err ? next(null) : next(node);
        // });
        next(node);
      } else if (_.include(node.type, "/type/collaborator")) {
        delete node.tan;
        return next(node);
      } else if (_.include(node.type, "/type/user")) {
        delete node.tan;
        return next(node);
      } else {
        next(node);
      }
    },

    write: function(node, next, session) {
      var that = this;
      
      if (_.include(node.type, "/type/document")) {
        isAuthorized(node, session.username, function(err) {
          if (err) return next(null);
          if (node._deleted) {
            this.db.view('version/by_document', {key: [node._id]}, function(err, res) {
              async.forEach(res.rows.map(function(d) { return d.value; }), function(version, callback) {
                version._deleted = true;
                db.save(version, callback);
              }, function(err) {
                return err ? next(null) : next(node);
              });
            });
          } else { // regular doc update
            return next(node);
          }
        });
        
        // TODO: Make sure that document deletion can only be done by the creator, not the collaborators.
      } else if (_.intersect(node.type, ["/type/section", "/type/visualization", "/type/text",
                                         "/type/question", "/type/answer", "/type/quote", "/type/image", "/type/reference"]).length > 0) {
        
        that.db.get(node.document, function(err, document) {
          if (err) return next(node); // if the document does not yet exist, pass it through
          
          isAuthorized(document, session.username, function(err) {
            if (!err) return next(node);
            // Allow just nodes
            that.db.get(node._id, function(err, n) {
              if (err) return next(null);
              n.comments = node.comments;
              return next(n);
            });
          });
        });
      } else if (_.include(node.type, "/type/collaborator")) {
        that.db.get(node._id, function(err, n) {
          // Restore tan from original node
          if (err) return next(null);
          node.tan = n.tan;
          next(node);
        });
      } else if (_.include(node.type, "/type/user")) {
        // Ensure username can't be changed for existing users
        that.db.get(node._id, function(err, user) {
          if (err) return next(null);
          if (node._rev) node.username = user.username;
          return next(node);
        });
      } else {
        return next(node);
      }
    }
  };
};


// Sanitize user input

Filters.sanitizeUserInput = function() {
  
  var basicMarkup = {
    "a":{
      href: function(href) {
        // accepts only links to anchors, absolute http, https and ftp URLs and email-addresses
        return /^((#[-_a-zA-Z0-9]+$)|mailto:|(https?|ftp):\/\/)/.test(href);
      }
    },
    "strong": {},
    "em": {},
    "b": {},
    "i": {},
    "br": {},
    "code": {},
    "p": {},
    "ul": {},
    "li": {},
    "ol": {}
  };
  
  function san(node, config) {
    var sanitized = {};
    _.each(node, function(value, key) {
      var cfg = _.include(node.type, "/type/text") && key === "content" ? basicMarkup : null;
      sanitized[key] = typeof value === "string" ? sanitize(value, cfg) : value;
    });
    return sanitized;
  }
  
  return {
    read: function(node, next, session) {
      next(node);
    },
    write: function(node, next, session) {
      if (!node) return next(node); // skip      
      next(san(node));
    }
  }
};


// Event logging and user notifications
// -----------

Filters.logEvents = function() {
  return {
    read: function(node, next, session) {
      next(node);
    },
    write: function(node, next, session) {
      var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
      
      // Extract users that will be notified
      function recipients(callback) {
        qry = [
          // Comment Authors
          {
            _id: node.document,
            "children": {
              "_recursive": true,
              "comments": {}
            }
          },
          // Subscribers
          {
            "type": "/type/subscription",
            "document": node.document
          }
        ];
        
        graph.fetch(qry, function(err, nodes) {
          if (err) return callback(err);
          var recipients = [graph.get(node.document).get('creator')._id];
          // Comment Authors
          graph.find({"type": "/type/comment"}).each(function(c) {
            recipients.push(c.get('creator')._id);
          });
          // Subscribers
          graph.find({"type": "/type/subscription"}).each(function(s) {
            recipients.push(s.get('user')._id);
          });
          
          // Do not notify the comment creator
          callback(_.uniq(_.without(recipients, node.creator)));
        })
      }
      
      // Log Event, then notify users
      function logEvent() {
        var doc = graph.get(node.document);
        var event = graph.set({
          type: "/type/event",
          event_type: "add-comment",
          creator: node.creator,
          object: node.document,
          message: "<strong>"+node.creator.split('/')[2]+"</strong> commented on <strong>"+doc._id.split('/')[2]+"/"+doc.get('name')+"</strong>",
          link: "/"+node.document.split('/')[2]+"/"+doc.get('name')+(node.version ? "/"+node.version.split('/')[3] : "")+"/"+node.node.replace(/\//g, '_')+"/"+node._id.replace(/\//g, '_'),
          created_at: new Date()
        });
        
        // Notify users
        recipients(function(recipients) {
          _.each(recipients, function(recipient) {
            var notification = graph.set({
              type: "/type/notification",
              event: event._id,
              read: false,
              recipient: recipient,
              created_at: event.get('created_at') // use date of the event
            });
          });
          
          graph.sync();
        });
      }
      
      var that = this;
      // Log event and notifications for comment addition
      if (_.include(node.type, "/type/comment") && !node._deleted) {
        // Fetch related info
        graph.fetch({_id: [node.document, node.node]}, function(err, nodes) {
          logEvent();
        });
      }
      next(node);
    }
  }
};


Filters.addMeta = function() {
  return {
    read: function(node, next, session) {
      if (_.include(node.type, "/type/network")) {
        node.meta = {};
        this.db.view('substance/publication_count', {key: ["/network/" + node._id.split('/')[2]]}, _.bind(function(err, res) {
          node.meta.documents = res.rows.length > 0 ? res.rows[0].value : 0;
          this.db.view('substance/member_count', {key: ["/network/" + node._id.split('/')[2]]}, function(err, res) {
            node.meta.members = res.rows.length > 0 ? res.rows[0].value : 0;
            next(node);
          });
        }, this));
      } else {
        next(node);
      }
    },
    write: function(node, next, session) {
      next(node);
    }
  }
};

module.exports = Filters;
