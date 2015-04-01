var oo = require('./oo');

function SubstanceError() {
  Error.apply(this, arguments);
};

SubstanceError.Prototype = function() {
};

oo.inherit(SubstanceError, Error);

module.exports = SubstanceError;
