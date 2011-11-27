var StateMachine = {
  transitionTo: function (state) {
    if (this.state !== state && this.invokeForState('leave', state) !== false) {
      this.state = state;
      this.invokeForState('enter');
    }
  },

  invokeForState: function (method) {
    var args = Array.prototype.slice.call(arguments, 1);
    
    var parent = this;
    while (parent) {
      var constructor = parent.constructor;
      if (constructor.states &&
          constructor.states[this.state] &&
          constructor.states[this.state][method]) {
        return constructor.states[this.state][method].apply(this, args);
      }
      // Inheritance is set up by Backbone's extend method
      parent = constructor.__super__;
    }
  }
};
