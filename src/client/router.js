// The Router
// ---------------

s.Router = Backbone.Router.extend({
  initialize: function() {
    // Using this.route, because order matters
    this.route(":username", "user", app.user);
    
    this.route(":username/:docname/:p1/:p2/:p3", "node", this.loadDocument);
    this.route(":username/:docname/:p1/:p2", "node", this.loadDocument);
    this.route(":username/:docname/:p1", "node", this.loadDocument);
    this.route(":username/:docname", "node", this.loadDocument);
    
    this.route("reset/:username/:tan", "reset", app.resetPassword);
    this.route("subscribed", "subscribed", app.subscribedDocs);
    this.route("recent", "recent", app.recentDocs);
    this.route("collaborate/:tan", "collaborate", app.collaborate);
    this.route("search/:searchstr", "search", app.searchDocs);
    this.route("register", "register", app.register);
    this.route("recover", "recover", app.recoverPassword);
    this.route("new", "new", app.newDocument);
    
    this.route("explore", "explore", app.explore);
    this.route("search", "search", app.search);
    
    this.route("", "home", app.home);
  },

  loadDocument: function(username, docname, p1, p2, p3) {
    var version = !p1 || p1.indexOf("_") >= 0 ? null : p1;
    var node = version ? p2 : p1;
    var comment = version ? p3 : p2;
    
    app.loadDocument(username, docname, version, node, comment);
  }
});
