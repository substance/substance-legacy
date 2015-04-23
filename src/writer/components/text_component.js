var $$ = React.createElement;
var TextProperty = require('./text_property')
var _ = require('substance/helpers');

// TextComponent
// ----------------
//

var TextComponent = React.createClass({

  displayName: "TextComponent",

  // array von containerannotations
  shouldComponentUpdate: function(nextProps, nextState) {
    var textAnnotations = _.pluck(this.refs.textProp.getAnnotations(), 'id');
    // Text highlights that are affecting this text component
    var textHighlights = _.intersection(textAnnotations, this.refs.textProp.getHighlights());

    var shouldUpdate = true;

    if (this._prevTextAnnotations) {
      if (_.isEqual(textAnnotations, this._prevTextAnnotations) && _.isEqual(textHighlights, this._prevTextHighlights)) {
        // console.log('skipping rerender of ', this.props.node.id);
        shouldUpdate = false;
      } else {
        // console.log('rerender of ', this.props.node.id);
        // console.log('annos', this.props.node.id, textAnnotations);
        // console.log('highlights', this.props.node.id, textHighlights);
        // console.log('---------------');
        // shouldUpdate = true;
      }
    }

    // Remember so we can check the next update
    this._prevTextAnnotations = textAnnotations;
    this._prevTextHighlights = textHighlights;

    return shouldUpdate;
  },

  componentDidUpdate: function() {
    // console.log('updated', this.props.node.id);
  },

  render: function() {
    return $$("div", { className: "content-node text", "data-id": this.props.node.id },
      $$(TextProperty, {
        ref: "textProp",
        doc: this.props.doc,
        path: [ this.props.node.id, "content"],
        writerCtrl: this.props.writerCtrl,
      })
    );
  }
});

module.exports = TextComponent;
