var _ = require('underscore');
var async = require('async');

// User
// --------------------------

var User = {};

User.find = function(searchstr, callback) {
  db.view('substance/users', function(err, res) {
    if (err) {
      callback(err);
    } else {
      var result = {};
      var count = 0;
      _.each(res.rows, function(row) {
        if (row.key && row.key.match(new RegExp("("+searchstr+")", "i"))) {
          if (count < 200) { // 200 Users maximum
            count += 1;
            result[row.value._id] = row.value;
            delete result[row.value._id].password
            delete result[row.value._id].email
          }
        }
      });
      callback(null, result);
    }
  });
}

module.exports = User;