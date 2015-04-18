var $$ = React.createElement;
var Substance = require("substance");


// Invariant: basic annotations can not overlap like there can not be two
// strong annotations for a particular range

var BasicToolMixin = {
  componentDidMount: function() {
    var writerCtrl = this.props.writerCtrl;
    writerCtrl.connect(this, {
      'selection:changed': this.handleSelectionChange
    });
  },

  // When there's no existing annotation overlapping, we create a new one.
  canCreate: function(annoSels) {
    return (annoSels.length === 0);
  },

  // When more than one annotation overlaps with the current selection
  canFusion: function(annoSels) {
    return (annoSels.length >= 2);
  },

  // When the cursor or selection is inside an existing annotation
  canRemove: function(annoSels, sel) {
    if (annoSels.length !== 1) return false;
    var annoSel = annoSels[0];
    return sel.isInside(annoSel);
  },

  // When there's some overlap with only a single annotation we do an expand
  canExpand: function(annoSels, sel) {
    if (annoSels.length !== 1) return false;
    var annoSel = annoSels[0];
    return sel.overlaps(annoSel);
  },

  canTruncate: function(annoSels, sel) {
    if (annoSels.length !== 1) return false;
    var annoSel = annoSels[0];
    return (sel.leftAligned(annoSel) || sel.rightAligned(annoSel)) && !sel.equals(annoSel);
  },

  handleSelectionChange: function(sel) {
    var writerCtrl = this.props.writerCtrl;

    // Note: toggling of a subject reference is only possible when
    // the subject reference is selected and the
    if (sel.isNull() || sel.isCollapsed() || !sel.isPropertySelection()) {
      return this.setState({
        active: false,
        selected: false
      });
    }

    var newState = {
      active: true,
      selected: false,
      mode: undefined
    };

    // Extract range and matching annos of current selection
    var range = sel.getTextRange();
    var annos = writerCtrl.doc.annotationIndex.get(sel.getPath(), range[0], range[1], this.annotationType);

    var annoSels = annos.map(function(anno) {
      var range = range;
      return Substance.Document.Selection.create(anno.path, anno.range[0], anno.range[1]);
    });

    if (this.canCreate(annoSels, sel)) {
      newState.mode = "create";
    } else if (this.canFusion(annoSels, sel)) {
      newState.mode = "fusion";
    } else if (this.canRemove(annoSels, sel)) {
      newState.mode = "remove";
    } else if (this.canTruncate(annoSels, sel)) {
      newState.mode = "truncate";
    } else if (this.canExpand(annoSels, sel)) {
      newState.mode = "expand";
    }

    this.setState(newState);
  },

  handleClick: function(e) {
    e.preventDefault(e);
  },

  handleMouseDown: function(e) {
    e.preventDefault();

    // Toggle annotation
    var writerCtrl = this.props.writerCtrl;
    var sel = writerCtrl.getSelection();

    if (sel.isNull() || !sel.isPropertySelection()) return;

    var range = sel.getTextRange();

    // var annotations = writerCtrl.doc.annotationIndex.get(sel.getPath(), range[0], range[1], this.annotationType);

    if (this.state.mode === "create") {
      writerCtrl.annotate({
        type: this.annotationType
      });
    } else if (this.state.mode === "fusion") {
      console.log('TODO: fusion dance');
    } else if (this.state.mode === "remove") {
      console.log('TODO: remove');
    } else if (this.state.mode === "truncate") {
      console.log('TODO: truncate');
    } else if (this.state.mode === "expand") {
      console.log('TODO: expand');
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
      onClick: this.handleClick,
      dangerouslySetInnerHTML: {__html: '<i class="fa '+this.toolIcon+'"></i>'}
    });
  }
};

module.exports = BasicToolMixin;