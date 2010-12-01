require('underscore');

// User Model
// -----------

// Just hides couchdb specifics
var unwrap = function(doc) {
  var result = _.extend(doc, { id: doc._id });
  delete result._id;
  delete result._rev;
  delete result.type;
  return result;
};


var User = {};

_.extend(User, {
  all: function(options) {
    db.view('substance/users', function (err, users) {
      var result = documents.map(function(d) {
        return {
          id: d._id,
          username: d.username,
          password: d.password
        };
      });

      options.success(JSON.parse(JSON.stringify(result)));
    });
  },

  get: function(username, options) {
    db.get('users:'+username, function (err, doc) {
      
      if (!err) {
        options.success(JSON.parse(JSON.stringify(unwrap(doc))));
      } else {
        
        if (options.error) options.error(err);
      }
    });
  },

  create: function(user, options) {
    db.save('users:'+user.username, _.extend(user, {type: 'user'}), function (err, result) {
      if (!err) {
        options.success();
      } else {
        if (options.error) options.error(err);
      }
    });
  }
});

module.exports = User;