var $$ = React.createElement;


// Redo Tool
// ----------------

var RedoTool = React.createClass({
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

  handleMouseDown: function(e) {
    e.preventDefault();
    if (!this.state.active) {
      return;
    }
    var doc = this.getDocument();
    doc.redo();
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return this.state.active !== nextState.active;
  },

  handleDocumentChange: function() {
    this.setState({
      active: (this.getDocument().undone.length > 0)
    });
  },

  getInitialState: function() {
    return {
      active: false
    };
  },

  render: function() {
    var classNames = ['redo-tool-component', 'tool'];
    if (this.state.active) classNames.push('active');

    return $$("a", {
      className: classNames.join(' '),
      href: "#",
      dangerouslySetInnerHTML: {__html: '<i class="fa fa-rotate-right"></i>'},
      title: 'Undo',
      onMouseDown: this.handleMouseDown
    });
  }
});

module.exports = RedoTool;