function removeChild (parent, child) {
  parent.all('children').del(child._id);
  //graph.del(node._id);
  //parent._dirty = true;
  //this.trigger('change:node', parent);
}

function createNode (type, position) {
  // TODO
}

function updateNode (node, attrs) {
  node.set(attrs);
  
  // Update modification date on original document
  node.get('document').set({ updated_at: new Date() });
  
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
