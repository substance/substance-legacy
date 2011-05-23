var _ = require('underscore');
var async = require('async');
var Counter = require('./counter');
var Data = require('../../lib/data/data');

// Middleware for graph read and write operations
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

Filters.logEvents = function() {
  return {
    read: function(node, next, session) {
      next(node);
    },
    write: function(node, next, session) {
      var that = this;
      // Log event and notifications for comment addition
      if (_.include(node.type, "/type/comment") && !node._deleted) {
        this.db.get(node.document, function(err, document) {
          that.db.save({
            _id: Data.uuid("/event/"),
            type: ["/type/event"],
            event_type: "add-comment",
            creator: node.creator,
            message: "<strong>"+node.creator.split('/')[2]+"</strong> commented on <strong>"+node.document.split('/')[2]+"/"+document.name+"</strong>",
            link: "#"+node.document.split('/')[2]+"/"+document.name+"/"+node.node.replace(/\//g, '_')+"/"+node._id.replace(/\//g, '_'),
            created_at: new Date()
          }, function(err, event) {
            // Insert notifications
            var recipient = "/user/"+node.document.split('/')[2];
            
            
            console.log(recipient);
            console.log(node.creator);
            // Don't notify the the document creator itself
            if (recipient !== node.creator) {
              console.log('Saving Notification...');
              that.db.save({
                _id: Data.uuid('/notification/'),
                type: ["/type/notification"],
                event: event._id,
                read: false,
                recipient: recipient,
                created_at: event.created_at // use date of the event
              }, function(err) {
                console.log('sent notification');
                console.log(err);
              });
            }
          });
        });
      }
      next(node);
    }
  }
};

module.exports = Filters;