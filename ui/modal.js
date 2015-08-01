var _ = require("substance/helpers");
var $$ = React.createElement;

var ModalPanel = React.createClass({
  contextTypes: {
    app: React.PropTypes.object.isRequired
  },

  displayName: "ManageBibItemsPanel",

  componentDidMount: function() {
    var modalEl = React.findDOMNode(this);
    $(modalEl).on('click', '.close-modal', this.handleCloseModal);
  },

  componentWillUnmount: function() {
    var modalEl = React.findDOMNode(this);
    $(modalEl).off('click', '.close-modal', this.handleCloseModal);
  },

  handleCloseModal: function(e) {
    this.context.app.closeModal();
    e.preventDefault();
  },

  // setTimeout(function() {
  //   $(window).one('mousedown', function(e) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     self.close();
  //   });
  // }, 0);

  preventBubbling: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  render: function() {
    return $$('div', {className: 'modal '+this.props.panelElement.type.modalSize, onClick: this.handleCloseModal},
      $$('div', {className: 'body', onClick: this.preventBubbling},
        this.props.panelElement
      )
    );
  }
});


module.exports = ModalPanel;