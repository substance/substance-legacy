// Register Notifications
var Notifications = {
  CONNECTED: {
    message: 'Just established a server connection.',
    type: 'info'
  },
  
  AUTHENTICATED: {
    message: 'Successfully authenticated.',
    type: 'success'
  },
  
  AUTHENTICATION_FAILED: {
    message: 'Authentication failed.',
    type: 'error'
  },
  
  SIGNUP_FAILED: {
    message: 'User Registration failed. Check your input',
    type: 'error'
  },
  
  DOCUMENT_LOADING: {
    message: 'Loading document ...',
    type: 'info'
  },
  
  DOCUMENT_LOADED: {
    message: 'Document successfully loaded.',
    type: 'success'
  },
  
  DOCUMENT_LOADING_FAILED: {
    message: 'An error ocurred during loading.',
    type: 'error'    
  },
  
  DOCUMENTS_LOADING: {
    message: 'Loading available documents ...',
    type: 'info'
  },
  
  DOCUMENTS_LOADED: {
    message: 'Documents fetched.',
    type: 'success'
  },
  
  DOCUMENTS_LOADING_FAILED: {
    message: 'An error occured during loading documents',
    type: 'error'
  }, 
  
  BLANK_DOCUMENT: {
    message: "You are now editing a blank document.",
    type: 'info'
  },
  
  DOCUMENT_SAVING: {
    message: "Saving document ...",
    type: 'info'
  },
  
  DOCUMENT_SAVED: {
    message: "The document has been stored in the repository.",
    type: 'success'
  },
  
  DOCUMENT_SAVING_FAILED: {
    message: "Error during saving.",
    type: 'error'
  },
  
  DOCUMENT_DELETING: {
    message: "Deleting document ...",
    type: 'info'
  },
  
  DOCUMENT_DELETED: {
    message: "The document has been deleted.",
    type: 'success'
  },
  
  DOCUMENT_DELETING_FAILED: {
    message: "Error during deletion.",
    type: 'error'
  },
  
  NEW_COLLABORATOR: {
    message: "A new collaborator just went online.",
    type: 'info'
  },
  
  EXIT_COLLABORATOR: {
    message: "One collaborator just left.",
    type: 'info'
  }
};


Backbone.Notifier = function(options) {
  options || (options = {});
  if (this.initialize) this.initialize(options);
};

_.extend(Backbone.Notifier.prototype, Backbone.Events, {
  notify: function(message) {
    this.trigger('message:arrived', message);
  }
});


// Set up global notification system
var notifier = new Backbone.Notifier();

// Listen for messages 
notifier.bind('message:arrived', function(message) {
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
});