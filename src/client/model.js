// Nodes
// =====

// Position
// --------

function Position (parent, after) {
  this.parent = parent;
  this.after  = after;
}

Position.prototype.toString = function () {
  return 'new Position(' + this.parent + ', ' + this.after + ')';
};


function getDocument (node) {
  return node.get('document') || node; // node can be the document itself
}

function removeChild (parent, child) {
  parent.all('children').del(child._id);
  graph.del(child._id);
  parent._dirty = true;
  child.trigger('removed');
}

function removeChildTemporary (parent, child) {
  parent.all('children').del(child._id);
  parent._dirty = true;
  child.trigger('removed');
}

function addChild (node, position) {
  var parent = position.parent
  ,   after  = position.after;
  
  var targetIndex;
  if (after === null) {
    // Insert at the beginning.
    targetIndex = 0;
  } else {
    targetIndex = parent.all('children').index(after._id) + 1;
  }
  
  parent.all('children').set(node._id, node, targetIndex);
  parent._dirty = true;
  
  parent.trigger('added-child', node, targetIndex);
}

function createNode (type, position) {
  var newNode = graph.set(null, {
    type: type,
    document: getDocument(position.parent)._id
  });
  
  addChild(newNode, position);
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

function canBeMovedHere (newParent, node) {
  // TODO
  return true;
}

function getTeaser (node) {
  if (node.type.key === "/type/section")
    return node.get('name') ? node.get('name').trim().substring(0, 15)+" ..." : "Section";
  else if (node.type.key === "/type/text")
    return _.stripTags(node.get('content')).trim().substring(0, 15)+" ...";
  else if (node.type.key === "/type/image")
    return "Image";
  else if (node.type.key === "/type/resource")
    return "Resource";
  else if (node.type.key === "/type/quote")
    return "Quote";
  else if (node.type.key === "/type/code")
    return "Code";
  return "N/A";
}


// Comments
// ========

function loadComments (node, callback) {
  graph.fetch({ type: '/type/comment', node: node._id }, function (err, nodes) {
    if (err) { return callback(err, null); }
    var ASC_BY_CREATED_AT = function (item1, item2) {
      var v1 = item1.value.get('created_at')
      ,   v2 = item2.value.get('created_at');
      return v1 === v2 ? 0 : (v1 < v2 ? -1 : 1);
    };
    callback(null, nodes.sort(ASC_BY_CREATED_AT));
  });
}

function createComment (node, content, callback) {
  window.pendingSync = true;
  
  var comment = graph.set(null, {
    type: '/type/comment',
    creator: '/user/' + app.username,
    created_at: new Date(),
    content: content,
    node: node._id,
    document: node.get('document')._id,
    version: this.version ? '/version/'+this.model._id.split('/')[3]+'/'+this.version : null
  });
  
  // Trigger immediate sync
  graph.sync(function (err) {
    window.pendingSync = false;
    callback(err);
  });
}

function removeComment (comment, callback) {
  window.pendingSync = true;
  graph.del(comment._id);
  graph.sync(function (err) {
    window.pendingSync = false;
    callback(err);
  });
}
