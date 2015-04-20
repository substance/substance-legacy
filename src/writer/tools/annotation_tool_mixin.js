var $$ = React.createElement;
var Substance = require("substance");


// Invariant: basic annotations can not overlap like there can not be two
// strong annotations for a particular range

var AnnotationToolMixin = Substance.extend({}, Substance.Surface.AnnotationTool.prototype, {

  getInitialState: function() {
    return {
      active: false,
      selected: false
    };
  },

  render: function() {
    var classNames = [this.annotationType+'-tool-component', 'tool'];
    if (this.state.active) classNames.push("active");
    if (this.state.selected) classNames.push("selected");
    return $$("a", {
      className: classNames.join(' '),
      href: "#",
      title: this.annotationType,
      onMouseDown: this.handleMouseDown,
      onClick: this.handleClick,
      dangerouslySetInnerHTML: {__html: '<i class="fa '+this.toolIcon+'"></i>'}
    });
  },

  componentDidMount: function() {
    var writerCtrl = this.props.writerCtrl;
    writerCtrl.connect(this, {
      'selection:changed': this.updateToolState
    });
  },

  getDocument: function() {
    return this.props.writerCtrl.doc;
  },

  getToolState: function() {
    return this.state;
  },

  setToolState: function(newState) {
    return this.setState(newState);
  },

  getAnnotationType: function() {
    return this.annotationType;
  },

  handleClick: function(e) {
    e.preventDefault(e);
  },

  handleMouseDown: function(e) {
    e.preventDefault();
    this.performAction();
  },

});

module.exports = AnnotationToolMixin;
