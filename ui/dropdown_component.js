var _ = require("substance/helpers");
var $$ = React.createElement;


var DropdownComponent = React.createClass({

  // Prevent click behavior as we want to preserve the text selection in the doc
  handleClick: function(e) {
    e.preventDefault();
  },

  handleDropdownToggle: function(e) {
    e.preventDefault();

    var open = this.state.open;
    var self = this;

    if (open) return;
    this.setState({open: !this.state.open});

    setTimeout(function() {
      $(window).one('mousedown', function(e) {
        // e.preventDefault();
        // e.stopPropagation();
        self.close();
      });
    }, 0);
  },

  close: function() {
    this.setState({
      open: false
    });
  },

  getInitialState: function() {
    return {
      open: false
    };
  },

  // Note: It's important that all children tools are rendered (even if not shown)
  // because only that way we can keep the disabled states accurate
  render: function() {
    var classNames = ['dropdown'];
    if (this.props.classNames) {
      classNames = classNames.concat(this.props.classNames);
    }
    if (this.state.open) {
      classNames.push('open');
    }
    return $$('div', {className: classNames.join(' ')},
      $$('button', {
        title: this.props.title,
        className: 'toggle',
        onMouseDown: this.handleDropdownToggle,
        onClick: this.handleClick
      }, this.props.label),
      $$('div', {className: 'options shadow border fill-white'}, this.props.children)
    );
  }
});

module.exports = DropdownComponent;