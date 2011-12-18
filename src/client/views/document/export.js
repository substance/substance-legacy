// Export
// -------------

s.views.Export = Backbone.View.extend({
  render: function(callback) {
    $('#document_shelf').html(s.util.tpl('document_export'));
    callback();
  }
});
