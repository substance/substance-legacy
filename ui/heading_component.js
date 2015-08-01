'use strict';

var TextProperty = require('substance-ui/text_property');
var $$ = React.createElement;

class HeadingComponent extends React.Component {
  render() {
    var level = this.props.node.level;
    return $$("div", { className: "content-node heading level-"+level, "data-id": this.props.node.id },
      $$(TextProperty, {
        ref: "textProp",
        doc: this.props.doc,
        path: [ this.props.node.id, "content"]
      })
    );
  }
}

HeadingComponent.displayName = "HeadingComponent";

module.exports = HeadingComponent;