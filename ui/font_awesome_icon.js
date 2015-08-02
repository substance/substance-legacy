'use strict';

var Component = require('./component');
var $$ = Component.$$;

class FontAwesomeIcon extends Component.Container {
  get tagName() {
    return 'i';
  }

  get classNames() {
    return 'fa ' + this.props.icon
  }
}

module.exports = FontAwesomeIcon;
