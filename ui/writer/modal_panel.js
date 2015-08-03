'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

function ModalPanel() {
  Component.apply(this,arguments);

  this.handleCloseModal = this.handleCloseModal.bind(this);
}

ModalPanel.Prototype = function() {

  this.didMount = function() {
    this.$el.on('click', '.close-modal', this.handleCloseModal);
    this.$el.on('click', '.modal-body', this.preventBubbling());
  };

  this.willUnmount = function() {
    this.$el.off('click');
  };

  this.render = function() {
    return $$('div', { classNames: 'modal '+this.props.panelElement.type.modalSize },
      $$('div', { classNames: 'modal-body' },
        this.props.panelElement
      )
    );
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
