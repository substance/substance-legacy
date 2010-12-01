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
  
  saveDocument: function(e) {
    if (app.model.id) {
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
      title: app.model ? app.model.data.title : 'Untitled',
      id: app.model ? app.model.id : null,
      model: app.model,
      num_collaborators: app.status ? app.status.collaborators.length : null,
      username: app.username
    }));
    
    this.bindEvents();
  },
  
  // bind events manually since declarative events do not work here for some reason
  bindEvents: function() {
    $(this.el).find('*').unbind();
    
    var that = this;
    
    this.$('a.browse-documents').bind('click', function(e) {
      that.toggle('DocumentBrowser', e);
    });
    
    this.$('a.view-collaborators').bind('click', function(e) {
      that.toggle('Collaborators', e);
    });
    
    this.$('a.save-document').bind('click', function(e) {
      that.saveDocument(e);
    });
    
    this.$('#create-document-form').submit(function(e) {
      app.createDocument(that.$('#document-name').val());
      that.close();
      return false;
    });
  },
  
  toggle: function(module, e) {
    if (!$(e.target).hasClass('selected')) { // Open
      this.shelfContent = new window[module]({el: this.$('#lpl_shelf_content')});
      this.shelfContent.render();
      this.bindEvents();
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