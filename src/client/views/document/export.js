// Export
// -------------

DocumentViews["export"] = Backbone.View.extend({
  render: function(callback) {
    $('#document_shelf').html(_.tpl('document_export'));
    callback();
  }
});