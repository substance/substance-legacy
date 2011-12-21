s.views.Export = Backbone.View.extend({

  className: 'shelf-content',

  render: function () {
    $(this.el).html(s.util.tpl('document_export', {
      baseUrl: document.location.href
    }));
    this.trigger('resize');
    return this;
  },

  load: function (callback) { callback(null); }

});
