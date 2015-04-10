var BasicToolMixin = require("./basic_tool_mixin");

var EmphasisTool = React.createClass({
  mixins: [BasicToolMixin],
  displayName: "EmphasisTool",
  annotationType: "emphasis",
  toolIcon: "fa-italic",
});

module.exports = EmphasisTool;