var AnnotationToolMixin = require("./annotation_tool_mixin");


var StrongTool = React.createClass({
  // TODO: try dis!
  // splitContainerSelections: true,
  mixins: [AnnotationToolMixin],
  displayName: "StrongTool",
  title: "Strong",
  annotationType: "strong",
  toolIcon: "fa-bold",
});

module.exports = StrongTool;