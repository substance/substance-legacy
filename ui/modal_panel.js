'use strict';

var Component = require('./component');
var $$ = Component.$$;

class ModalPanel extends Component {

  constructor(parent, props) {
    super(parent, props);

    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  get classNames() {
    return 'modal '+this.props.panelElement.type.modalSize;
  }

  didMount() {
    this.$el.on('click', '.close-modal', this.handleCloseModal);
    this.$el.on('click', '.modal-body', this.preventBubbling());
  }

  willUnmount() {
    this.$el.off('click');
  }

  handleCloseModal(e) {
    e.preventDefault();
    this.send('closeModal');
  }

  preventBubbling(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  render() {
    return $$('div', { classNames: 'modal-body' },
      this.props.panelElement
    );
  }
}

module.exports = ModalPanel;
