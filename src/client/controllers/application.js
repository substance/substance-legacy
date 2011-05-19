var ApplicationController = Backbone.Controller.extend({
  routes: {
    '^(?!search)(.*)\/(.*)\/(.*)\/(.*)$$': 'loadDocument',
    '^(?!search)(.*)\/(.*)\/(.*)$': 'loadDocument',
    '^(?!search)(.*)\/(.*)$': 'loadDocument',
    ':username': 'userDocs',
    '^search\/(.*)$': 'searchDocs'
  },
  
  loadDocument: function(username, docname, node, comment) {
    app.browser.load({"type": "user", "value": username});
    app.document.loadDocument(username, docname, node, comment);
    
    $('#document_wrapper').attr('url', '#'+username+'/'+docname+(node ? "/"+node : "")+(comment ? "/"+comment : ""));
    $('#browser_wrapper').attr('url', '#'+username);
    return false;
  },
  
  userDocs: function(username) {    
    if (!username) { // startpage rendering
      if (app.username) {
        username = app.username;
      } else {
        return app.toggleStartpage();
      }
    }
    
    if (username === 'recent') {
      app.browser.load({"type": "recent", "value": 50});
    } else {
      app.browser.load({"type": "user", "value": username});
    }
    
    $('#browser_wrapper').attr('url', '#'+username);
    
    app.browser.bind('loaded', function() {
      app.toggleView('browser');
      app.browser.unbind('loaded');
    });
    return false;
  },
  
  searchDocs: function(searchstr) {
    
    app.searchDocs(searchstr);
    return false;
  }
});