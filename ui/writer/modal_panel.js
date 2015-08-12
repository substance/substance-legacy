'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

function ModalPanel() {
  Component.apply(this,arguments);
}

ModalPanel.Prototype = function() {

  this.render = function() {
    return $$('div')
      .addClass('modal '+this.props.panelElement.type.modalSize)
      .append(
        $$('div')
          .addClass('modal-body')
          .append(this.props.panelElement)
          .on('click', this.preventBubbling)
      );
  };

  this.didMount = function() {
    this.$el.on('click', '.close-modal', this.handleCloseModal.bind(this));
  };

  this.willUnmount = function() {
    this.$el.off('click');
  };

  this.handleCloseModal = function(e) {
    e.preventDefault();
    this.send('closeModal');
  };

  this.preventBubbling = function(e) {
    e.stopPropagation();
    e.preventDefault();
  };
};

OO.inherit(ModalPanel, Component);

module.exports = ModalPanel;
