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
    var $message = $('<p class="notification"><span>info:</span>'+message.message+'</p>');
    $('#notifications .wrapper').append($message);
    
    if (message.message.indexOf('...') !== -1) {
      $message.addClass('activity');
      
    } else {
      $('#notifications .wrapper p.activity').remove();
      // Just flash message if it's not a wait... message
      setTimeout(function() {
        $message.remove();
      }, 4000);
    }
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('menu', {
      title: this.model ? this.model.g.data.title : ''
    }));
  }
});