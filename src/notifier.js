// Register Notifications
var Notifications = {
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
    message: "A new collaborator just left.",
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