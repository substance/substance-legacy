// Export
// -------------

s.views.Export = Backbone.View.extend({
  render: function() {
    $('#document_shelf').html(s.util.tpl('document_export'));
  }
});
