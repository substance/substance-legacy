var _ = require('underscore');
var async = require('async');
var Counter = require('./counter');

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

module.exports = Filters;