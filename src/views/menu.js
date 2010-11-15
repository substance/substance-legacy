var Menu = Backbone.View.extend({
  events: {
    
  },
  
  initialize: function() {
    var that = this;
    
    // Listen for messages 
    notifier.bind('message:arrived', function(message) {
      that.renderMessage(message);
    });
  },
  
  renderMessage: function(message) {
    this.$('#notifications').show();
    this.$('.message').html(message.message);
    
    if (message.message.indexOf('...') !== -1) {
      // Show acitivity indicator
      this.$('.activity').show();
    } else {
      // Hide acitivity indicator
      this.$('.activity').hide();
      
      // Just flash message if it's not a wait... message
      setTimeout(function() {
        this.$('#notifications').hide();
      }, 2000);      
    }
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('menu', {
      title: this.model ? this.model.g.data.title : ''
    }));
  }
});