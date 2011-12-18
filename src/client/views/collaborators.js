s.views.Collaborators = Backbone.View.extend({
  
  initialize: function () {
    this.render();
  },
  
  render: function () {
    var author = app.editor.model.author
    ,   name = app.editor.model.name
    ,   hostname = window.location.hostname + (window.location.port !== 80 ? ":" + window.location.port : "")
    ,   url = 'http://'+hostname+'/#'+author+'/'+name;
    
    $(this.el).html(s.util.tpl('collaborators', {
      status: app.editor.status,
      url: url
    }));
    return this;
  }
});
