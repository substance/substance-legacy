var ApplicationController = Backbone.Controller.extend({
  routes: {
    ':username/:docname': 'loadDocument',
    ':username/:docname/:node': 'loadDocument'
  },

  loadDocument: function(username, docname, node) {
    app.document.loadDocument(username, docname, name);
    return false;
  }
});
