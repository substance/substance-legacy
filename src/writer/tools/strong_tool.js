var BasicToolMixin = require("./basic_tool_mixin");

var StrongTool = React.createClass({
  mixins: [BasicToolMixin],
  displayName: "StrongTool",
  annotationType: "strong",
  toolIcon: "fa-bold",
});

module.exports = StrongTool;