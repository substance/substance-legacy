var $$ = React.createElement;
var _ = require("substance/helpers");


// Text Tool
// ----------------

var TextTool = React.createClass({
  displayName: "TextToolComponent",

  contextTypes: {
    toolRegistry: React.PropTypes.object.isRequired
  },

  componentWillMount: function() {
    var toolName = this.props.tool;
    if (!toolName) {
      throw new Error('Prop "tool" is mandatory.');
    }

    this.tool = this.context.toolRegistry.get(toolName);
    if (!this.tool) {
      console.error('No tool registered with name %s', toolName);
    }
    this.tool.connect(this, {
      'toolstate:changed': this.onToolstateChanged
    });
  },

  onToolstateChanged: function(toolState, tool, oldState) {
    this.replaceState(toolState);
  },

  handleClick: function(e) {
    e.preventDefault();
  },

  handleSwitchTextType: function(e) {
    e.preventDefault();
    this.tool.switchTextType(e.currentTarget.dataset.type);
  },

  getInitialState: function() {
    return {
      disabled: true,
      open: false
    };
  },

  toggleAvailableTextTypes: function(e) {
    e.preventDefault();
    if (this.tool.isDisabled()) return;

    // HACK: This only updates the view state state.open is not set on the tool itself
    // That way the dropdown automatically closes when the selection changes
    this.setState({
      open: !this.state.open
    });
  },

  render: function() {
    var classNames = ['text-tool-component', 'select'];
    var textTypes = this.tool.getAvailableTextTypes();

    // Note: this is a view internal state for opening the select dropdown
    if (this.state.open) classNames.push('open');
    if (this.state.disabled) classNames.push('disabled');

    var isTextContext = textTypes[this.state.currentTextType];
    var label;

    if (isTextContext) {
      label = textTypes[this.state.currentTextType].label;
    } else if (this.state.currentContext) {
      
      label = this.state.currentContext // i18n.t(this.state.currentContext);
    } else {
      label = 'No selection';
    }

    var currentTextTypeEl = $$('button', {
        href: "#",
        className: "toggle",
        onMouseDown: this.toggleAvailableTextTypes,
        onClick: this.handleClick
      }, label);

    var availableTextTypes = [];
    availableTextTypes = _.map(textTypes, function(textType, textTypeId) {
      return $$('button', {
        key: textTypeId,
        className: 'option '+textTypeId,
        "data-type": textTypeId,
        onMouseDown: this.handleSwitchTextType,
        onClick: this.handleClick
      }, textType.label);
    }.bind(this));

    return $$("div", { className: classNames.join(' ')},
      currentTextTypeEl,
      $$('div', {className: "options shadow border fill-white"}, availableTextTypes)
    );
  }
});

module.exports = TextTool;
