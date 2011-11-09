var renderControls = function(node, first, last, parent, level) {
  
  function render(node, destination, consolidate) {
    var actions = new Data.Hash();
    var innerNode = null;
    var path = [];
    
    // Ensure correct order
    actions.set('/type/section', []);
    actions.set('/type/text', []);
    actions.set('/type/image', []);
    actions.set('/type/resource', []);
    actions.set('/type/quote', []);
    actions.set('/type/code', []);
    
    function computeActions(n, parent) {
      function registerAction(action) {
        if (action.nodeType === '/type/section' && action.level > 3) return;
        // if (actions.get(action.nodeType)) {
        if (action.nodeType === '/type/section') {
          var SORT_BY_LEVEL = function(v1, v2) {
            return v1.level === v2.level ? 0 : (v1.level < v2.level ? -1 : 1);
          }
          var choices = actions.get(action.nodeType);
          choices.push(action);
          choices.sort(SORT_BY_LEVEL);
          actions.set(action.nodeType, choices);
        } else if (!actions.get(action.nodeType)[0] || action.level > actions.get(action.nodeType)[0].level) {
          // Always use deepest level for leave nodes!
          actions.set(action.nodeType, [action]);
        }
      }
      
      var nlevel = parseInt($('#'+n.html_id).attr('level'));
      innerNode = n;
      n.level = nlevel;
      if (nlevel<=3) path.push(n);
      
      // Possible children
      if (n.all('children') && n.all('children').length === 0 && destination === 'after') {
        var children = n.properties().get('children').expectedTypes;
        
        _.each(children, function(type) {
          registerAction({
            node: n._id,
            parentNode: parent ? parent._id : null,
            nodeType: type,
            nodeTypeName: graph.get(type).name,
            insertionType: 'child',
            level: nlevel+1
          });
        });
      }

      // Possible siblings
      if (parent) {
        var siblings = parent.properties().get('children').expectedTypes;
        _.each(siblings, function(type) {
          registerAction({
            node: n._id,
            parentNode: parent ? parent._id : null,
            nodeType: type,
            nodeTypeName: graph.get(type).name,
            insertionType: 'sibling',
            level: nlevel
          });
        });
      }
      
      // Consolidate actions for child elements
      if (consolidate && n.all('children') && n.all('children').length > 0) {
        computeActions(n.all('children').last(), n);
      }
      return actions;
    }
    computeActions(node, parent);
    
    // Move insertion type for leaf nodes
    var moveInsertionType = innerNode.all('children') && innerNode.all('children').length === 0 && destination === 'after' ? "child" : "sibling";
    
    return _.tpl('controls', {
      node: innerNode,
      insertion_type: moveInsertionType,
      destination: destination,
      actions: actions,
      path: path
    });
  }
  
  // Top level
  if (!parent) {
    // Cleanup
    $('#document .controls').remove();
    if (!node.all('children') || node.all('children').length === 0) {
      $(render(node, 'after')).appendTo($('#'+node.html_id));
    }
  } else {
    //  Insert before, but only for starting nodes (first=true)
    if (first) $(render(node, 'before')).insertBefore($('#'+node.html_id));
    
    if (!last || parent.types().get('/type/document')) {
      $(render(node, 'after', true)).insertAfter($('#'+node.html_id));
    }
  }
  
  if (node.all('children')) {
    // Do the same for all children
    node.all('children').each(function(child, key, index) {
      var first = index === 0;
      var last = index === node.all('children').length-1;
      renderControls(child, first, last, node, level + 1);
    });
  }
};

