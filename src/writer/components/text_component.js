var $$ = React.createElement;
var TextProperty = require('./text_property')

// TextComponent
// ----------------
//

var TextComponent = React.createClass({

  displayName: "TextComponent",

  render: function() {
    return $$("div", { className: "content-node text", "data-id": this.props.node.id },
      $$(TextProperty, {
        doc: this.props.doc,
        path: [ this.props.node.id, "content"],
        writerCtrl: this.props.writerCtrl,
      })
    );
  }
});

module.exports = TextComponent;
