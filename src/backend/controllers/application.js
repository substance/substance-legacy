var ApplicationController = Backbone.Controller.extend({
  routes: {
    ':username/:docname': 'loadDocument',
    'signup': 'renderSignupForm'
  },

  loadDocument: function(username, docname) {
    if (app.authenticated) {
      app.loadDocument('users:'+username+':documents:'+docname);
    }
    return false;
  },
  
  renderSignupForm: function() {
    app.renderSignupForm();
  }
});