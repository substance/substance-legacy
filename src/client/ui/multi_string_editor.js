UI.MultiStringEditor = Backbone.View.extend({
  events: {
    'submit form': 'newItem',
    'click a.remove-item': 'removeItem'
  },
  
  initialize: function(options) {
    var that = this;
    this._items = options.items || [];
    
    // Re-render on every change
    this.bind('changed', function() {
      that.render();
    });
    
    // Finally, render
    this.render();
  },
  
  // Add a new value for the property
  newItem: function(e) {
    var val = this.$('input[name=new_value]').val();
    
    if (!_.include(this._items, val)) {
      this._items.push(val); 
      this.trigger('changed');
      this.render(); // re-render
    } else {
      this.trigger('error:alreadyexists');
    }
    return false;
  },
  
  // Remove a certain value
  removeItem: function(e) {
    var val = $(e.target).attr('value');
    this._items = _.reject(this._items, function(v) { return v === val; });
    this.trigger('changed');
    return false;
  },
  
  // Get the current value [= Array of values]
  value: function() {
    return this._items;
  },
  
  // Render the editor, including the display of values
  render: function() {
    $(this.el).html(_.renderTemplate('multi_string_editor', {
      items: this._items
    }));
  }
});