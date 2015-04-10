var $$ = React.createElement;

var BasicToolMixin = {
  componentDidMount: function() {
    var writerCtrl = this.props.writerCtrl;
    writerCtrl.connect(this, {
      'selection:changed': this.handleSelectionChange
    });
  },

  handleSelectionChange: function(sel) {
    var writerCtrl = this.props.writerCtrl;

    if (sel.isNull() || !sel.isPropertySelection()) {
      this.setState({
        active: false,
        selected: false
      });
    } else {
      var range = sel.getTextRange();
      var annotations = writerCtrl.doc.annotationIndex.get(sel.getPath(), range[0], range[1], this.annotationType);
      var selected = annotations.length > 0;
      var active = !sel.isCollapsed();

      this.setState({
        active: active,
        selected: selected
      });
    }
  },

  handleMouseDown: function(e) {
    e.preventDefault();
    // e.stopPropagation();

    // toggle annotation
    var writerCtrl = this.props.writerCtrl;
    var sel = writerCtrl.getSelection();

    if (sel.isNull() || !sel.isPropertySelection()) return;

    var range = sel.getTextRange();
    var annotations = writerCtrl.doc.annotationIndex.get(sel.getPath(), range[0], range[1], this.annotationType);

    if (annotations.length > 0) {
      writerCtrl.deleteAnnotation(annotations[0].id);
    } else {
      // Do nothing if selection is collapsed
      if (sel.isCollapsed()) return;

      // Create new subject reference
      writerCtrl.annotate({
        type: this.annotationType
      });
    }
  },

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
      title: 'Emphasis',
      onMouseDown: this.handleMouseDown,
      dangerouslySetInnerHTML: {__html: '<i class="fa '+this.toolIcon+'"></i>'}
    });
  }
};

module.exports = BasicToolMixin;