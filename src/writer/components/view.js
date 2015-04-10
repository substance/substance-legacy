'use strict';

var Substance = require('substance');

function View(props) {
  this.props = props;
}

View.Prototype = function() {

  this.tagName = 'div';

  this.createElement = function() {
    var element = document.createElement(this.props.tagName || this.tagName);
    var $element = $(element);
    var classNames = this.getClassNames();
    if (Substance.isArray(classNames)) {
      classNames = classNames.join(' ');
    }
    $element.addClass(classNames);
    Substance.each(this.props, function(val, key) {
      var match = /^data-.*/.exec(key);
      if (match) {
        $element.attr(match[0], val);
      }
    });
    return element;
  };

  this.getClassNames = function() {
    return this.props.classNames || [];
  };

  this.render = function() {
    var element = this.createElement();
    var children = this.props.children;
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (Substance.isString(child)) {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof View) {
          var el = child.render();
          element.appendChild(el);
        } else if (child instanceof window.Element) {
          element.appendChild(child);
        }
      }
    }
    return element;
  };
};

Substance.initClass(View);

module.exports = View;
