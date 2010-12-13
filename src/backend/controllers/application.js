var ApplicationController = Backbone.Controller.extend({
  routes: {
    'toggle/:view': 'toggleView',
    'load/:username/:docname': 'loadDocument'
  },

  loadDocument: function(username, docname) {
    if (app.authenticated) {
      app.editor.loadDocument('users:'+username+':documents:'+docname);
    }    
    return false;
  },
  
  // Toggle View
  toggleView: function(view) {
    app.toggleView(view);
  }
});