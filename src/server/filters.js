var _ = require('underscore');
var async = require('async');
var Data = require('../../lib/data/data');


// Middleware for graph read and write operations
// -----------

var Filters = {};
Filters.ensureAuthorized = function() {
  return {
    read: function(node, next, session) {
      // Hide all password properties
      delete node.password;      
      next(node);
    },

    write: function(node, next, session) {
      var that = this;
      
      if (_.include(node.type, "/type/document")) {
        return node.creator !== "/user/"+session.username ? next(null) : next(node);
        // TODO: Make sure that document deletion can only be done by the creator, not the collaborators.
      } else if (_.intersect(node.type, ["/type/section", "/type/visualization", "/type/text",
                                         "/type/question", "/type/answer", "/type/quote", "/type/image", "/type/reference"]).length > 0) {
        
        that.db.get(node.document, function(err, document) {
          if (err) return next(node); // if the document does not yet exist
          if (document.creator !== "/user/"+session.username) {
            // Allow just nodes
            that.db.get(node._id, function(err, n) {
              if (err) return next(null);
              n.comments = node.comments;
              return next(n);
            });
          } else {
            return next(node);
          }
        });
      } else if (_.include(node.type, "/type/user")) {
        // Ensure username can't be changed for existing users
        that.db.get(node._id, function(err, user) {
          if (err) return next(null);
          
          if (node._rev) node.username = user.username;
          next(node);
        });
      } else {
        next(node);
      }
    }
  };
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
          var recipients = [];
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
          link: "#"+node.document.split('/')[2]+"/"+doc.get('name')+"/"+node.node.replace(/\//g, '_')+"/"+node._id.replace(/\//g, '_'),
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

module.exports = Filters;