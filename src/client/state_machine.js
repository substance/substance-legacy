var StateMachine = {
  transitionTo: function (state) {
    if (this.state !== state && this.invokeForState('leave', state) !== false) {
      this.state = state;
      this.invokeForState('enter');
    }
  },

  invokeForState: function (method) {
    var args = Array.prototype.slice.call(arguments, 1);
    
    var parent = this.constructor;
    while (parent) {
      if (parent &&
          parent.states &&
          parent.states[this.state] &&
          parent.states[this.state][method]) {
        return parent.states[this.state][method].apply(this, args);
      }
      parent = parent.__super__;
    }
  }
};
