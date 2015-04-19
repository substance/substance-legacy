var AnnotationToolMixin = require("./annotation_tool_mixin");

var StrongTool = React.createClass({
  mixins: [AnnotationToolMixin],
  displayName: "StrongTool",
  annotationType: "strong",
  toolIcon: "fa-bold",
});

module.exports = StrongTool;