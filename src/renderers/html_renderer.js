// HTMLRenderer
// ---------------

var HTMLRenderer = function(root) {

  // Implement node types
  var renderers = {
    document: function(node) {
      var str = '<div id="root" draggable="true" class="content-node document"><div class="content-node-info">-&gt; drag to move &lt;-&nbsp;&nbsp;&nbsp;&nbsp; Document</div><div class="border"></div><h1>' + node.data.title + '</h1>';
      
      
      if (node.all('children').length > 0) {
        node.all('children').each(function(node, key, index) {
          str += renderers[node.type](node);
        
          // register placeholders
          var html = Helpers.renderTemplate('actions', {
            node: node,
            children: [], // ContentNode.types[node.type].allowedChildren,
            siblings: node.parent ? ContentNode.types[node.parent.type].allowedChildren : []
          });
          
          str += '<div class="node-actions" node="'+node.key+'">' + html + '</div>';
          str += '<div class="node-placeholder '+ContentNode.types[node.parent.type].allowedChildren.join(' ')+'" node="'+node.key+'">drop here</div>';
        });
        
      } else {
        // register placeholders
        var html = Helpers.renderTemplate('actions', {
          node: node,
          children: ContentNode.types[node.type].allowedChildren,
          siblings: []
        });

        str += '<div class="node-actions" node="'+node.key+'">' + html + '</div>';
        // str += '<div class="node-placeholder" type="child" node="'+node.key+'">drop here</div>';
      }

      str += '</div>';
      return str;
    },
    section: function(node) {
      // var str = '<h'+(this.level+1)+' id="section_'+this.sectionId+'">'+this.val+'</h'+(this.level+1)+'>';
      var str = '<div id="'+node.key+'" draggable="true" class="content-node section"><a href="#" class="remove_node" node="'+node.key+'">X</a><div class="content-node-info">-&gt; drag to move &lt;-&nbsp;&nbsp;&nbsp;&nbsp; Section</div><div class="border"></div><h2>'+node.data.name+'</h2>';

      if (node.all('children').length > 0) {
        node.all('children').each(function(node, key, index) {
          str += renderers[node.type](node); // node.render();
        
          // register placeholders
          var html = Helpers.renderTemplate('actions', {
            node: node,
            children: [], // ContentNode.types[node.type].allowedChildren,
            siblings: node.parent ? ContentNode.types[node.parent.type].allowedChildren : []
          });

          str += '<div class="node-actions" node="'+node.key+'">' + html + '</div>';
          str += '<div class="node-placeholder '+ContentNode.types[node.parent.type].allowedChildren.join(' ')+'" node="'+node.key+'">drop here</div>';

        });
      } else {
        
        // register placeholders
        var html = Helpers.renderTemplate('actions', {
          node: node,
          children: ContentNode.types[node.type].allowedChildren,
          siblings: []
        });

        str += '<div class="node-actions" node="'+node.key+'">' + html + '</div>';
        str += '<div class="node-placeholder '+ContentNode.types[node.parent.type].allowedChildren.join(' ')+'" node="'+node.key+'">drop here</div>';

      }

      str += "</div>";
      return str;
    },
    paragraph: function(node) {
      var str = '<div id="'+node.key+'" draggable="true" class="content-node paragraph"><a href="#" class="remove_node" node="'+node.key+'">X</a><div class="content-node-info">-&gt; drag to move &lt;-&nbsp;&nbsp;&nbsp;&nbsp; Paragraph</div><div class="border"></div>';

      var converter = new Showdown.converter();
      str += converter.makeHtml(node.data.content);
      // str += node.data.content;
      
      // node.all('children').each(function(node, key, index) {
      //   str += renderers[node.type](node); // node.render();
      // });
      
      str += '</div>';

      return str;
    },
    image: function(node) {
      var str = '<div id="'+node.key+'" draggable="true" class="content-node image"><a href="#" class="remove_node" node="'+node.key+'">X</a><div class="content-node-info">-&gt; drag to move &lt;-&nbsp;&nbsp;&nbsp;&nbsp; Image</div><div class="border"></div>';

      if (node.data.url.length > 0) {
        str += '<img src="'+node.data.url+'"/>';
      } else {
        str += "image placeholder ...";
      }

      str += "</div>";
      return str;
    }
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type](root);
    }
  };
};