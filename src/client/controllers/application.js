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
    
    $('#document_wrapper').attr('url', '#'+username+'/'+docname);
    $('#browser_wrapper').attr('url', '#'+username);
    return false;
  },
  
  userDocs: function(username) {
    // username = username.length > 0 ? username : app.username;
    
    if (!username) { // startpage rendering
      return app.toggleStartpage();
    }
    
    app.browser.load({"type": "user", "value": username});
    
    $('#browser_wrapper').attr('url', '#'+username);
    
    app.browser.bind('loaded', function() {
      app.toggleView('browser');
    });
    
    return false;
  },
  
  searchDocs: function(searchstr) {
    app.searchDocs(searchstr);
    return false;
  }
});