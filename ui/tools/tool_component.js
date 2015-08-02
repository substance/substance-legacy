'use strict';

var $$ = React.createElement;
var Substance = require('substance');

// ToolComponent
// -------------

class ToolComponent extends React.Component {

  constructor(props) {
    super(props);

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onToolstateChanged = this.onToolstateChanged.bind(this);
  }

  componentWillMount() {
    var toolName = this.props.tool;
    if (!toolName) {
      throw new Error('Prop "tool" is mandatory.');
    }

    this.tool = this.context.toolRegistry.get(toolName);
    if (!this.tool) {
      console.warn('No tool registered with name %s', toolName);
      this.tool = new ToolComponent.StubTool(toolName);
    }

    // Derive initial state from tool
    this.state = this.tool.state;
    this.tool.connect(this, {
      'toolstate:changed': this.onToolstateChanged
    });
  }

  onToolstateChanged(toolState/*, tool, oldState*/) {
    this.setState(toolState);
  }

  onClick(e) {
    e.preventDefault();
  }

  onMouseDown(e) {
    e.preventDefault();
    if (this.state.disabled) {
      return;
    }
    this.tool.performAction();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.state.disabled !== nextState.disabled ||
      this.state.active !== nextState.active);
  }

  render() {
    var classNames = [];

    if (this.props.classNames) {
      classNames = this.props.classNames.slice();
    }

    if (this.state.disabled) {
      classNames.push('disabled');
    }
    if (this.state.active) {
      classNames.push("active");
    }

    return $$("button", {
      className: classNames.join(' '),
      title: this.props.title,
      onMouseDown: this.onMouseDown,
      onClick: this.onClick
    }, this.props.children);
  }
}

ToolComponent.displayName = "ToolComponent";

ToolComponent.contextTypes = {
  toolRegistry: React.PropTypes.object.isRequired
};


ToolComponent.StubTool = Substance.Surface.Tool.extend({

  init: function(name) {
    this.name = name;
  },

  performAction: function() {
    console.log('Stub-Tool %s', this.name);
  }
});

module.exports = ToolComponent;