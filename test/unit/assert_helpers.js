var _ = require('../../helpers');

QUnit.assert.isEmpty = function(a, msg) {
  this.push(_.isEmpty(a), false, true, msg);
};