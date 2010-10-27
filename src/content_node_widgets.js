// Attach Widget implementations
ContentNodeEditor.widgets.default = function(editor, node) {
  // attach handlers that trigger a change
  var view = { properties: [] };
  
  uv.each(node.data, function(n, key) {
    if (key !== "type") {
      view.properties.push({key: key, value: n});
    }
  });
  
  var html = Helpers.renderTemplate('edit_default', view);
  
  // render a key-value-pair editor
  $('#editor').html(html);
  
  $('#edit_node .property').keydown(function() {
    setTimeout(function() {
      editor.updateContentNode(node);
    }, 5);
  });
};


ContentNodeEditor.widgets.paragraph = function(editor, node) {  
  var html = Helpers.renderTemplate('edit_paragraph', node.data, {
    em: false,
    strong: false
  });
  
  // render a key-value-pair editor
  $('#editor').html(html);
  
  $('#edit_node .property').keydown(function() {
    setTimeout(function() {
      editor.updateContentNode(node);
    }, 5);
  });
};


ContentNodeEditor.widgets.section = function(editor, node) {  
  var html = Helpers.renderTemplate('edit_section', node.data, {
    em: node.data.em_level == 1,
    strong: node.data.em_level == 2
  });
  
  // render a key-value-pair editor
  $('#editor').html(html);
  
  $('#edit_node .property').keydown(function() {
    setTimeout(function() {
      editor.updateContentNode(node);
    }, 5);
  });
};
