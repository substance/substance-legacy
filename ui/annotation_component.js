"use strict";

var Component = require('./component');
var $$ = Component.$$;

class AnnotationComponent extends Component {

  get tagName: function() {
    return 'span'
  }

  get classNames: function() {
    var typeNames = this.props.node.getTypeNames();
    var classNames = typeNames.join(' ');
    if (this.props.classNames) {
      classNames += " " + this.props.classNames.join(' ');
    }
    return classNames.replace(/_/g, '-');
  }

  get attributes() {
    return {
      "data-id": this.props.node.id
    };
  }

  render() {
    if (this.props.node.active) {
      this.$el.addClass('active');
    } else {
      this.$el.removeClass('active');
    }
    return this.props.children;
  }

  didMount() {
    var node = this.props.node;
    node.connect(this, {
      'active': this.onActiveChanged
    });
  }

  willUnmount() {
    var node = this.props.node;
    node.disconnect(this);
  }

  onActiveChanged() {
    if (this.props.node.active) {
      this.$el.addClass('active');
    } else {
      this.$el.removeClass('active');
    }
  }
}

module.exports = AnnotationComponent;
