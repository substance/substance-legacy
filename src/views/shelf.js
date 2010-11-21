var Shelf = Backbone.View.extend({
  events: {
    
  },
  
  initialize: function() {
    var that = this;
    
    // Listen for messages 
    notifier.bind('message:arrived', function(message) {
      that.renderMessage(message);
    });
  },
  
  close: function() {
    $(this.el).removeClass('open');
    $(this.el).addClass('closed');
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
    var that = this;
    
    $(this.el).html(Helpers.renderTemplate('shelf', {
      title: this.model ? this.model.g.data.title : 'Untitled',
      id: this.model ? this.model.id : null
    }));
    
    // bind events manually since declarative events do not work here for some reason
    this.$('a.browse-documents').bind('click', function(e) {
      that.toggle('DocumentBrowser', e);
    });
    
    this.$('a.view-collaborators').bind('click', function(e) {
      that.toggle('Collaborators', e);
    });
  },
  
  toggle: function(module, e) {
    if (!$(e.target).hasClass('selected')) { // Open
      this.shelfContent = new window[module]({el: this.$('#lpl_shelf_content'), model: this.model});
      this.shelfContent.render();
      
      $('#lpl_shelf').removeClass('closed');
      $('#lpl_shelf').addClass('open');
      $('#lpl_actions .header.button').removeClass('selected');
      $(e.target).addClass('selected');
    } else { // Close
      $('#lpl_shelf').removeClass('open');
      $('#lpl_shelf').addClass('closed');
      $(e.target).removeClass('selected');
    }
  }
});