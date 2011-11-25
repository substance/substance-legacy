UI.MultiStringEditor = Backbone.View.extend({
  events: {
    'submit form': 'newItem',
    'click a.remove-item': 'removeItem',
    'click .available-item a': 'selectAvailableItem',
    'keydown input': 'inputChange',
    'click input': 'initInput',
    'blur input': 'reset'
  },
  
  initialize: function(options) {
    var that = this;
    this._items = options.items || [];
    this._availableItems = options.availableItems;
    
    // Re-render on every change
    this.bind('changed', function() {
      that.render();
    });
    
    // Finally, render
    this.render();
  },
  
  initInput: function() {
    // this.updateSuggestions();
  },
  
  reset: function() {
    this.$('.available-items').empty();
  },
  
  inputChange: function(e) {
    var that = this;
    
    var suggestions = this.$('.available-item');
    if (e.keyCode === 40) { // down-key
      if (this.selectedIndex < suggestions.length-1) this.selectedIndex += 1;
      this.teaseSuggestion();
    } else if (e.keyCode === 38){ // up-key
      if (this.selectedIndex>=0) this.selectedIndex -= 1;
      this.teaseSuggestion();
    } else {
      setTimeout(function() {
        that.trigger('input:changed', that.$('input[name=new_value]').val());
      }, 200);
    }
  },
  
  teaseSuggestion: function() {
    var suggestions = this.$('.available-item');
    this.$('.available-item.selected').removeClass('selected');
    if (this.selectedIndex>=0 && this.selectedIndex < this.$('.available-item').length) {
      $(this.$('.available-item')[this.selectedIndex]).addClass('selected');
    }
  },
  
  // Update matched suggestions
  updateSuggestions: function(suggestions) {
    var that = this;
    that.$('.available-items').empty();
    _.each(suggestions, function(item, key) {
      that.$('.available-items').append($('<div class="available-item"><a href="#" id="'+item._id+'" name="'+item.name+'" value="'+item.name+'">'+item.name+'</a></div>'));
    });
    this.selectedIndex = -1;
  },
  
  selectAvailableItem: function(e) {
    this.$('input[name=new_value]').val($(e.currentTarget).attr('value'));
    this.$('input[name=new_value]').focus();
    return false;
  },
  
  // Add a new value for the property
  newItem: function(e) {
    if (this.selectedIndex >= 0) {
      this.$('input[name=new_value]').val(this.$('.available-item.selected a').attr('value'));
    }
        
    var val = this.$('input[name=new_value]').val();
    if (!_.include(this._items, val) && val.length > 0) {
      this._items.push(val); 
      this.trigger('changed');
      this.render(); // re-render
      this.$('input[name=new_value]').focus();
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
    $(this.el).html(_.tpl('multi_string_editor', {
      items: this._items
    }));
  }
});
