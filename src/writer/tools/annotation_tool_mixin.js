var $$ = React.createElement;
var Substance = require("substance");


// Invariant: basic annotations can not overlap like there can not be two
// strong annotations for a particular range

var AnnotationTool = Substance.Surface.AnnotationTool.extend({

  getDocument: function() {
    return this.props.writerCtrl.doc;
  },

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
    return (sel.isLeftAligned(annoSel) || sel.isRightAligned(annoSel)) && !sel.equals(annoSel);
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
    var annos = writerCtrl.doc.annotationIndex.get(sel.getPath(), sel.getStartOffset(), sel.getEndOffset(), this.annotationType);
    var annoSels = annos.map(function(anno) {
      return Substance.Document.Selection.create(anno.path, anno.startOffset, anno.endOffset);
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
    var doc = writerCtrl.doc;

    if (sel.isNull() || !sel.isPropertySelection()) return;

    switch (this.state.mode) {
      case "create":
        return this.handleCreate();
      case "fusion":
        return this.handleFusion();
      case "remove":
        return this.handleRemove();
      case "truncate":
        return this.handleTruncate();
      case "expand":
        return this.handleExpand();
      default:
        console.error('Unknown mode: %s', this.state.mode);
    }
  },

  handleCreate: function() {
    var tx = doc.startTransaction();
    try {

  },

  handleFusion: function() {

  },

  handleRemove: function() {

  },

  handleTruncate: function() {

  },

  handleExpand: function() {

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