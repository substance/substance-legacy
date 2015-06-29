var _ = require('../../helpers');

QUnit.assert.isEmpty = function(a, msg) {
  this.push(_.isEmpty(a), false, true, msg);
};

QUnit.assert.isNullOrUndefined = function(a, msg) {
  this.push((a === null)||(a === undefined), false, true, msg);
}
