var ApplicationController = Backbone.Controller.extend({
  routes: {
    ':username/:docname': 'loadDocument',
    ':username/:docname/:node': 'loadDocument',
    ':username': 'userDocs'
  },
  
  loadDocument: function(username, docname, node) {
    app.browser.load({"type|=": "/type/document", "creator": "/user/"+username});
    app.document.loadDocument(username, docname, node);
    return false;
  },
  
  userDocs: function(username) {
    username = username.length > 0 ? username : 'substance';
    app.browser.load({"type|=": "/type/document", "creator": "/user/"+username});
    return false;
  }
});
