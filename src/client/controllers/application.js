var ApplicationController = Backbone.Controller.extend({
  routes: {
    '^(?!search)(.*)\/(.*)$': 'loadDocument',
    '^(?!search)(.*)\/(.*)\/(.*)$': 'loadDocument',
    ':username': 'userDocs',
    '^search\/(.*)$': 'searchDocs'
  },
  
  loadDocument: function(username, docname, node) {
    app.browser.load({"type": "user", "value": username});
    app.document.loadDocument(username, docname, node);
    return false;
  },
  
  userDocs: function(username) {
    username = username.length > 0 ? username : app.username;
    if (!username) {
      // Render start page
      $('#content_wrapper').html(_.tpl('startpage'));
      app.toggleView('content');
      return;
    }
    
    app.browser.load({"type": "user", "value": username});
    app.toggleView('browser');
    return false;
  },
  
  searchDocs: function(searchstr) {
    app.browser.load({"type": "search", "value": searchstr});
    app.toggleView('browser');
    return false;
  }
});