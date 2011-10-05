var CodeEditor = Backbone.View.extend({
  events: {},
  
  initialize: function () {
    var cm = activateCodeMirror(this.$('textarea').get(0));
    cm.focus();
    
    this.$('select').change(function () {
      var language = $(this).val();
      app.document.updateSelectedNode({
        language: language
      });
      cm.setOption('mode', getCodeMirrorModeForLanguage(language));
    });
  }
});
