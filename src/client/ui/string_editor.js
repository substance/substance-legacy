UI.StringEditor = Backbone.View.extend({
  events: {
    'change input': 'updateValue'
  },
  
  initialize: function(options) {
    var that = this;
    this._value = options.value;
    
    // Re-render on every change
    this.bind('changed', function() {
      that.render();
    });
    
    // Finally, render
    this.render();
  },
  
  // Add a new value for the property
  updateValue: function(e) {
    var val = this.$('input[name=value]').val();

    this._value = val;
    this.trigger('changed');
    this.render(); // re-render
    
    return false;
  },
  
  // Get the current set of values
  value: function() {
    return this._value;
  },
  
  // Render the editor, including the display of values
  render: function() {
    $(this.el).html(_.renderTemplate('string_editor', {
      value: this._value
    }));
  }
});