'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var TextProperty = require('../text_property_component');
var $$ = Component.$$;

function FigureComponent() {
  Component.apply(this, arguments);
}

FigureComponent.Prototype = function() {

  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var contentNode = this.props.node.getContentNode();
    var ContentComponentClass = componentRegistry.get(contentNode.type);
    var specificType = this.props.node.type;

    return $$('div', { classNames: "content-node figure clearfix "+specificType, "data-id": this.props.node.id},
      $$('div', { classNames: 'label', contentEditable: false }, this.props.node.label),
      $$(TextProperty, {
        tagName: 'div',
        classNames: 'title',
        doc: this.props.doc,
        path: [this.props.node.id, "title"]
      }),
      $$('div', { classNames: 'figure-content' },
        $$(ContentComponentClass, {
          doc: this.props.doc,
          node: contentNode
        })
      ),
      $$('div', { classNames: 'description small' },
        $$(TextProperty, {
          tagName: 'div',
          classNames: 'caption',
          doc: this.props.doc,
          path: [this.props.node.id, "caption"]
        })
      )
    );
  };
};

OO.inherit(FigureComponent, Component);

module.exports = FigureComponent;
