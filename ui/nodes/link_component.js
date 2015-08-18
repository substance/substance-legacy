var AnnotationComponent = require('./annotation_component');

var LinkComponent = AnnotationComponent.extend({
  render: function() {
    var el = AnnotationComponent.prototype.render.call(this);
    return el.attr("title", this.props.node.title);
  },

  didMount: function() {
    AnnotationComponent.prototype.didMount.call(this);
    var node = this.props.node;
    var doc = node.getDocument();
    doc.getEventProxy('path').add([node.id, 'title'], this, this.rerender);
    doc.getEventProxy('path').add([node.id, 'url'], this, this.rerender);
  },

  willUnmount: function() {
    AnnotationComponent.prototype.willUnmount.call(this);
    var node = this.props.node;
    var doc = node.getDocument();
    doc.getEventProxy('path').remove([node.id, 'title'], this);
    doc.getEventProxy('path').remove([node.id, 'url'], this);
  }

});

module.exports = LinkComponent;