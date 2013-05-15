Substance.View = function(options) {

  // Construction

  Backbone.View.apply(this, [options]);
  var proto = Substance.util.prototype(this);

  // Delegats global messags based on spec
  proto.delegateMessages = function() {
    _.each(this.messages, function(handler, message) {
      app.bind('message:'+message, this[handler], this);
      // Register binding for later disposal
      this._bindings.push([app, 'message:'+message, this[handler]]);
    }, this);
  };

  // Delegate bindings as speced
  proto.delegateBindings = function() {
    _.each(this.bindings, function(binding) {
      var props = binding[0].split('.');
      var eventName = binding[1];
      var handler = this[binding[2]];
      var target = this;

      if (props.length > 0 && props[0] !== "this") {
        _.each(props, function(p) {
          target = target[p];
        });
      }
      target.bind(eventName, handler, this);
      // Register binding for later disposal
      this._bindings.push([target, eventName, handler]);
    }, this);
  };

  // // Unbind handlers
  proto.disposeBindings = function() {
    _.each(this._bindings, function(b) {
      var target = b[0];
      var eventName= b[1];
      var handler = b[2];

      target.unbind(eventName, handler);
    });
  };

  // Initialization
  this._bindings = [];
  this.delegateMessages();
  this.delegateBindings();
};

Substance.View.prototype = Backbone.View.prototype;
Substance.View.extend = Backbone.View.extend;