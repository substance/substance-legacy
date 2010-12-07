var DocumentEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    if (!$('#main').hasClass('drawer-opened')) {
      app.editor.drawer.toggle();
    }
    
    this.$node = $('#' + app.editor.model.selectedNode.key + ' > .content');
    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(event) {
      that.updateNode();
    });
    
  },
  
  updateNode: function() {
    var that = this;
    setTimeout(function() {
      app.editor.model.updateSelectedNode({
        title: that.$node.html(),
        publication_date: $('#editor input[name=publication_date]').val(),
        tags: $('#editor textarea[name=document_tags]').val()
      });
      
      app.editor.trigger('document:changed');
    }, 5);
  },
  
  render: function() {
    var that = this; 
    
    $(this.el).html(Helpers.renderTemplate('edit_document', _.extend({
      attributes: settings.attributes
    }, app.editor.model.selectedNode.data)));
    
    // Initialize AttributeEditors for non-unique-strings
    $('.attribute-editor').each(function() {
      var key = $(this).attr('key'),
          unique = $(this).hasClass('unique'),
          type = $(this).attr('type'),
          value = app.editor.model.attributes[key]; // property value / might be an array or a single value

      var editor = that.createAttributeEditor(key, type, unique, value, $(this));
      editor.bind('changed', function() {
        app.editor.model.attributes[key] = editor.value();
      });
    });
  },
  
  createAttributeEditor: function(key, type, unique, value, target) {
    switch (type) {
      case 'string':
        if (unique) {
          return this.createStringEditor(key, value, target);
        } else {
          return this.createMultiStringEditor(key, value, target);
        }
      break;
      case 'number':
      break;
      case 'boolean':
      break;
    }
  },
  
  createMultiStringEditor: function(key, value, target) {
    var that = this;
    var editor = new UI.MultiStringEditor({
      el: target,
      items: value
    });
    return editor;
  },
  
  createStringEditor: function(key, value, target) {
    var that = this;
    var editor = new UI.StringEditor({
      el: target,
      value: value
    });
    return editor;
  }
});