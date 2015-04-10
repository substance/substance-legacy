var Substance = require('substance');
var NodeView = require('./node_view');

var AnnotationView = NodeView.extend({
  name: "annotation",

  tagName: 'span',

  getClassNames: function() {
    var classNames = this.node.getClassNames().replace(/_/g, '-');
    if (this.props.classNames) {
      classNames += " " + this.props.classNames.join(' ');
    }
    return classNames;
  }
});

module.exports = AnnotationView;
