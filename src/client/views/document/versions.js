s.views.Versions = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_versions',

  // Events
  // ------

  events: {
    'click .remove-version': '__removeVersion',
    'click .toggle-version': '__toggleVersion'
  },

  __toggleVersion: function(e) {
    
    var link  = $(e.currentTarget)
    ,   route = link.attr('href').replace(/^\//, '');
    router.navigate(route, true);
    return false;
  },

  __removeVersion: function (e) {
    var version = $(e.currentTarget).attr('data-version');
    removeVersion(this.model, version, _.bind(function () {
      this.data = null;
      this.load(this.render);
    }, this));
    return false;
  },

  initialize: function () {
    _.bindAll(this);
    this.data = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_versions', {
      document: this.model,
      versions: this.data.versions
    }));

    this.trigger('resize');
    return this;
  },

  load: function (callback) {
    if (this.data) {
      callback(null);
    } else {
      loadVersions(this.model, _.bind(function (err, res) {
        if (!err) { this.data = res; }
        callback(err);
      }, this));
    }
  }

});