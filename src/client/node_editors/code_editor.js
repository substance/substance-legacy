var CodeEditor = Backbone.View.extend({
  events: {},
  
  initialize: function () {
    activateCodeMirror(this.$('textarea').get(0)).focus();
  }
});
