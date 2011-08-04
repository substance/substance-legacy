var Attributes = Backbone.View.extend({
  
  initialize: function() {
    this.el = '#attributes';
  },
  
  render: function() {
    app.document.mode === 'edit' ? this.renderEdit() : this.renderShow();
  },
  
  renderShow: function() {
    var that = this; 
    var doc = app.document.model;
    var attributes = [];
    
    var attributes = doc.properties().select(function(property) {
      if (property.expectedTypes[0] === '/type/attribute') {
        return true;
      }
    });
    
    $(this.el).html(_.tpl('show_attributes', {
      attributes: attributes,
      doc: doc
    }));
  },
  
  availableAttributes: function(property) {
    return graph.find({
      "type|=": ['/type/attribute'],
      member_of: '/'+ property.type._id.split('/')[2]+'/'+property.key
    });
  },
  
  renderEdit: function() {
    var that = this; 
    var doc = app.document.model;
    var attributes = [];
    
    var attributes = doc.properties().select(function(property) {
      if (property.expectedTypes[0] === '/type/attribute') {
        return true;
      }
    });
    
    $(this.el).html(_.tpl('edit_attributes', {
      attributes: attributes,
      doc: doc
    }));
    
    // Initialize AttributeEditors for non-unique-strings
    $('.attribute-editor').each(function() {
      var member_of = $(this).attr('property');
      var property = graph.get('/type/'+member_of.split('/')[1]).get('properties', member_of.split('/')[2]),
          key = $(this).attr('key'),
          unique = $(this).hasClass('unique'),
          type = $(this).attr('type');
          
          // property value / might be an array or a single value
          value = unique 
                  ? app.document.model.get(key).get('name') 
                  : _.map(app.document.model.get(key).values(), function(v) { return v.get('name'); });
    
      var editor = that.createAttributeEditor(key, type, unique, value, $(this));
      editor.bind('input:changed', function(value) {
        if (value.length < 2) return editor.updateSuggestions({});
        $.ajax({
          type: "GET",
          data: {
            member: member_of,
            search_str: value
          },
          url: "/attributes",
          dataType: "json"
        }).success(function(res) {
          graph.merge(res.graph);
          editor.updateSuggestions(res.graph);
        });
      });
      
      editor.bind('changed', function() {        
        var attrs = [];

        _.each(editor.value(), function(val) {
          // Find existing attribute
          var attr = graph.find({
            "type|=": ['/type/attribute'],
            member_of: member_of,
            name: val
          }).first();
          
          if (!attr) {
            // Create attribute as it doesn't exist
            attr = graph.set(null, {
              type: ["/type/attribute"],
              member_of: member_of,
              name: val
            });
          }
          attrs.push(attr._id);
        });
        
        // Update document
        var tmp = {};
        tmp[key] = attrs;
        app.document.model.set(tmp);
        app.document.trigger('changed');
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
