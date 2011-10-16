Node.define('/type/code', 'Code', {

  className: 'content-node code',

  events: _.extend({
    'change select': 'changeLanguageSelect'
  }, Node.prototype.events),

  initialize: function () {
    this.__super__.initialize.apply(this, arguments);
  },

  languages: [ 'JavaScript', 'Python', 'Ruby', 'PHP', 'HTML', 'CSS', 'Haskell'
             , 'CoffeeScript', 'Java', 'C', 'C++', 'CSharp', 'Other'
             ],

  modeForLanguage: function (language) {
    return {
      javascript: 'javascript',
      python: { name: 'python', version: 3 },
      ruby: 'ruby',
      php: 'php',
      html: 'htmlmixed',
      css: 'css',
      haskell: 'haskell',
      coffeescript: 'coffeescript',
      java: 'text/x-java',
      c: 'text/x-csrc',
      'c++': 'text/x-c++src',
      csharp: 'text/x-csharp'
    }[language] || 'null';
  },

  changeLanguageSelect: function () {
    var newLanguage = this.languageSelect.val();
    updateNode(this.model, { language: newLanguage });
    this.codeMirror.setOption('mode', this.modeForLanguage(newLanguage));
  },

  readonly: function () {
    this.codeMirror.setOption('readOnly', true);
  },

  readwrite: function () {
    this.codeMirror.setOption('readOnly', false);
  },

  codeMirrorConfig: {
    lineNumbers: true,
    theme: 'elegant',
    indentUnit: 2,
    indentWithTabs: false,
    tabMode: 'shift',
  },

  render: function () {
    function createSelect (dflt, opts) {
      var html = '<select>';
      _.each(opts, function (lang) {
        var value = lang.toLowerCase();
        selected = dflt === value ? ' selected="selected"' : '';
        html += '<option value="' + value + '"' + selected + '>' + lang + '</option>';
      });
      html += '</select>';
      return html;
    }
    
    this.__super__.render.apply(this, arguments);
    this.languageSelect = $(createSelect(this.model.get('language'), this.languages)).appendTo(this.contentEl);
    var codeMirrorConfig = _.extend({}, this.codeMirrorConfig, {
      mode: this.modeForLanguage(this.model.get('language')),
      readOnly: true,
      //onFocus: function () {
      //  // Without this, there is the possibility to focus the editor without
      //  // activating the code node. Don't ask me why.
      //  el.trigger('click');
      //},
      //onBlur: function () {
      //  cm.setSelection({line:0,ch:0}, {line:0,ch:0});
      //},
      onChange: _.throttle(function () {
        // TODO
        //app.document.updateSelectedNode({
        //  content: escape(cm.getValue())
        //});
      }, 500)
    });
    this.codeMirror = CodeMirror(this.contentEl.get(0), codeMirrorConfig);
    return this;
  }

});
