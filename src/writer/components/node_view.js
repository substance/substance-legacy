var Substance = require('substance');
var View = require('./view');

var NodeView = View.extend({
  _init: function() {
    this.doc = this.props.doc;
    this.node = this.props.node;
  },
  createElement: function() {
    var element = View.prototype.createElement.call(this);
    element.dataset.id = this.node.id;
    return element;
  }
});

module.exports = NodeView;