var $$ = React.createElement;

// Undo Tool
// ----------------

var UndoTool = React.createClass({
  displayName: "SaveTool",

  contextTypes: {
    backend: React.PropTypes.object.isRequired
  },

  getDocument: function() {
    return this.props.writerCtrl.doc;
  },

  componentDidMount: function() {
    var doc = this.getDocument();
    doc.connect(this, {
      'document:changed': this.handleDocumentChange
    });
  },

  handleClick: function(e) {
    e.preventDefault();
  },

  // Do we really need a backend?
  handleMouseDown: function(e) {

    e.preventDefault();
    e.stopPropagation();

    if (!this.state.active) {
      return;
    }
    var doc = this.getDocument();
    doc.undo();
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return this.state.active !== nextState.active;
  },

  handleDocumentChange: function() {
    this.setState({
      active: (this.getDocument().done.length > 0)
    });
  },

  getInitialState: function() {
    return {
      active: false
    };
  },

  render: function() {
    var classNames = ['undo-tool-component', 'tool'];
    if (this.state.active) classNames.push('active');

    return $$("a", {
      className: classNames.join(' '),
      href: "#",
      dangerouslySetInnerHTML: {__html: '<i class="fa fa-undo"></i>'},
      title: 'Undo',
      onMouseDown: this.handleMouseDown,
      onClick: this.handleClick
    });
  }
});

module.exports = UndoTool;