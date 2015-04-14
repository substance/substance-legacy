var Substance = require('../basics');
var NodeView = require('./node_view');

var AnnotationView = NodeView.extend({
  name: "annotation",

  tagName: 'span',

  getClassNames: function() {
    var classNames = this.node.getClassNames().replace('_', '-');
    if (this.props.classNames) {
      classNames += " " + this.props.classNames.join(' ');
    }
    return classNames;
  }
});

module.exports = AnnotationView;
