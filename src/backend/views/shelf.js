var Shelf = Backbone.View.extend({
  
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
  
  saveDocument: function(e) {
    if (app.editor.model.id) {
      app.saveDocument();
    } else {
      this.toggle('CreateDocument', e);
    }
    
    return false;
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
      title: app.editor.model ? app.editor.model.data.title : 'Untitled',
      id: app.editor.model ? app.editor.model.id : null,
      model: app.editor.model,
      num_collaborators: app.editor.status ? app.editor.status.collaborators.length : null,
      username: app.username
    }));
  },

  
  toggle: function(module, e) {
    if (!$(e.target).hasClass('selected')) { // Open
      this.shelfContent = new window[module]({el: this.$('#sbs_shelf_content')});
      this.shelfContent.render();
      $('#sbs_shelf').removeClass('closed');
      $('#sbs_shelf').addClass('open');
      $('#sbs_actions .header.button').removeClass('selected');
      $(e.target).addClass('selected');
    } else { // Close
      $('#sbs_shelf').removeClass('open');
      $('#sbs_shelf').addClass('closed');
      $(e.target).removeClass('selected');
    }
  }
});