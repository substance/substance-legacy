function getDocument (node) {
  return node.get('document') || node; // node can be the document itself
}

function removeChild (parent, child) {
  parent.all('children').del(child._id);
  graph.del(child._id);
  parent._dirty = true;
  
  child.trigger('removed');
}

function createNode (type, position) {
  var parent = position.parent
  ,   after  = position.after;
  
  var newNode = graph.set(null, {
    type: type,
    document: getDocument(parent)._id
  });
  
  var targetIndex;
  if (after === null) {
    // Insert at the beginning.
    targetIndex = 0;
  } else {
    targetIndex = parent.all('children').index(after._id) + 1;
  }
  
  parent.all('children').set(newNode._id, newNode, targetIndex);
  parent._dirty = true;
  
  parent.trigger('added-child', newNode, targetIndex);
}

function updateNode (node, attrs) {
  node.set(attrs);
  
  // Update modification date on original document
  getDocument(node).set({ updated_at: new Date() });
  
  //// Only set dirty if explicitly requested    
  //if (attrs.dirty) {
  //  this.trigger('change:node', this.selectedNode);
  //}
  //
  //if (this.selectedNode.type.key === '/type/document') {
  //  this.trigger('changed');
  //}
  //
  //// Notify all collaborators about the changed node
  //if (this.status && this.status.collaborators.length > 1) {
  //  var serializedNode = this.selectedNode.toJSON();
  //  delete serializedNode.children;
  //  // remote.Session.registerNodeChange(this.selectedNode._id, serializedNode);
  //}
}

function possibleChildTypes (node) {
  // TODO
  return ['/type/section', '/type/text', '/type/image', '/type/resource', '/type/quote', '/type/code'];
}
