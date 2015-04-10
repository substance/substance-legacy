var $$ = React.createElement;

// The Content Panel
// ----------------

var ContentTools = React.createClass({
  displayName: "ContentTools",
  render: function() {
    var tools = this.props.writerCtrl.getTools();
    var props = {
      writerCtrl: this.props.writerCtrl,
      doc: this.props.doc,
      switchContext: this.props.switchContext
    };

    var toolComps = tools.map(function(tool, index) {
      props.key = index;
      return $$(tool, props);
    });

    return $$("div", {className: "content-tools-component"},
      $$('div', {className: "tools"},
        toolComps
      )
    );
  }
});

module.exports = ContentTools;