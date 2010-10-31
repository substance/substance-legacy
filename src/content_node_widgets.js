// Default Widget

ContentNodeEditor.widgets['default'] = function(editor, node) {
  // Attach handlers that trigger a change
  var view = { properties: [] };
  
  uv.each(node.data, function(n, key) {
    if (key !== "type") {
      view.properties.push({key: key, value: n});
    }
  });
  
  var html = Helpers.renderTemplate('edit_default', view);
  
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

  $('#editor').html(html);
  
  $('#edit_node .property').keydown(function() {
    setTimeout(function() {
      editor.updateContentNode(node);
    }, 5);
  });
};


ContentNodeEditor.widgets.image = function(editor, node) {
  var html = Helpers.renderTemplate('edit_image', node.data, {
    em: false,
    strong: false
  });
  
  $('#editor').html(html);
  
  
  $('#MyForm').transloadit({
    modal: false,
    wait: true,
    autoSubmit: false,
    onProgress: function(bytesReceived, bytesExpected) {
      percentage = (bytesReceived / bytesExpected * 100).toFixed(2)
      $('#upload_progress').attr('style', 'width:' + percentage +'%');
      $('#image_progress_legend').html('<strong>Uploading:</strong> ' + percentage + '% complete</div>');
    },
    onError: function(assembly) {
      alert(assembly.error+': '+assembly.message);
    },
    onStart: function() {
      $('#progress_container').show();
    },
    onSuccess: function(assembly) {
      try {
        node.data.url = assembly.results.resize_image[0].url;
        editor.renderNode(node);
        $('#progress_container').hide();
      } catch (err) {
        console.log(assembly);
        console.log(err);
        alert('Strange upload error. See console.');
      }
    }
  });
};


ContentNodeEditor.widgets.section = function(editor, node) {  
  var html = Helpers.renderTemplate('edit_section', node.data, {
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
