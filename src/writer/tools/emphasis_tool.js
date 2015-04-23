var AnnotationToolMixin = require("./annotation_tool_mixin");

var EmphasisTool = React.createClass({
  mixins: [AnnotationToolMixin],
  displayName: "EmphasisTool",
  title: "Emphasis",
  annotationType: "emphasis",
  toolIcon: "fa-italic",
});

module.exports = EmphasisTool;