'use strict';

var Component = require('../component');
var $$ = Component.$$;

// This is an abstract class
class Panel extends Component {

  getDocument() {
    var app = this.context.app;
    return app.doc;
  }

  getPanelContentElement() {
    return this.refs.panelContent.$el[0];
  }

  getScrollableContainer() {
    return this.refs.panelContent.$el[0];
  }

  // Returns the cumulated height of a panel's content
  getContentHeight() {
    // initialized lazily as this element is not accessible earlier (e.g. during construction)
    // get the new dimensions
    // TODO: better use outerheight for contentheight determination?
    var contentHeight = 0;
    var panelContentEl = this.getPanelContentElement();

    $(panelContentEl).children().each(function() {
     contentHeight += $(this).outerHeight();
    });
    return contentHeight;
  }

  // Returns the height of panel (inner content overflows)
  getPanelHeight() {
    var panelContentEl = this.getPanelContentElement();
    return $(panelContentEl).height();
  }

  getScrollPosition() {
    var panelContentEl = this.getPanelContentElement();
    return $(panelContentEl).scrollTop();
  }

  // This method must be overriden with your panel implementation
  render() {
    return $$("div", {classNames: "panel"},
      $$('div', {classNames: 'panel-content'}, 'YOUR_PANEL_CONTENT')
    );
  }

  // Get the current coordinates of the first element in the
  // set of matched elements, relative to the offset parent
  // Please be aware that it looks up until it finds a parent that has
  // position: relative|absolute set. So for now never set relative somewhere in your panel
  getPanelOffsetForElement(el) {
    var offsetTop = $(el).position().top;
    return offsetTop;
  }

  scrollToNode(nodeId) {
    // var n = this.findNodeView(nodeId);
    // TODO make this generic
    var panelContentEl = this.getScrollableContainer();

    // Node we want to scroll to
    var targetNode = $(panelContentEl).find("*[data-id="+nodeId+"]")[0];

    if (targetNode) {
      $(panelContentEl).scrollTop(this.getPanelOffsetForElement(targetNode));
    } else {
      console.warn(nodeId, 'not found in scrollable container');
    }
  }
}

module.exports = Panel;
