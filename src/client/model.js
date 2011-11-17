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

function isSection (node) {
  return node.type.key === '/type/section';
}

function isLastChild (parent, child) {
  return parent.all('children').last() === child;
}

function removeChild (parent, child, temporary) {
  var wasLastChild = isLastChild(parent, child);
  parent.all('children').del(child._id);
  if (!temporary) { graph.del(child._id); }
  parent._dirty = true;
  child.trigger('removed');
  if (wasLastChild) { parent.trigger('last-child-changed'); }
}

function removeChildTemporary (parent, child) {
  removeChild(parent, child, true);
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
  
  if (isSection(node)) {
    var lastSection = node, lastChild;
    while ((lastChild = lastSection.all('children').last()) && isSection(lastChild)) {
      lastSection = lastChild;
    }
    
    addFollowingSiblings(new Position(parent, node), lastSection);
  }
  
  parent.trigger('added-child', node, targetIndex);
  if (isLastChild(parent, node)) {
    parent.trigger('last-child-changed');
  }
}

function moveChild (oldParent, node, newPosition) {
  removeChildTemporary(oldParent, node);
  addChild(node, newPosition);
}

function createNode (type, position) {
  var newNode = graph.set(null, {
    type: type,
    document: getDocument(position.parent)._id
  });
  
  addChild(newNode, position);
}

function getFollowingSiblings (position) {
  function slice (hash, n) {
    var sliced = new Data.Hash();
    hash.each(function (val, key, index) {
      if (index >= n) {
        sliced.set(key, val);
      }
    });
    return sliced;
  }
  
  var parent = position.parent
  ,   after  = position.after;
  
  var children = parent.all('children');
  return after === null ? children
                        : slice(children, children.index(after._id) + 1);
}

function addFollowingSiblings (position, section) {
  var parent = position.parent;
  var stop = false;
  getFollowingSiblings(position).each(function (sibling) {
    if (stop || isSection(sibling)) {
      stop = true;
    } else {
      var position = new Position(section, section.all('children').last() || null);
      moveChild(parent, sibling, position);
    }
  });
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

function possibleChildTypes (position) {
  var defaultOrder = [ '/type/section'
                     , '/type/text'
                     , '/type/image'
                     , '/type/resource'
                     , '/type/quote'
                     , '/type/code' ]
  
  function indexOf (element, array) {
    var i = array.indexOf(element);
    return i >= 0 ? i : Infinity;
  }
  
  function compareByDefaultOrder (a, b) {
    return indexOf(a, defaultOrder) < indexOf(b, defaultOrder) ? -1 : 1;
  }
  
  // Haskell's 'on' function from Data.Function
  function on (fn1, fn2) {
    return function (a, b) {
      return fn1(fn2(a), fn2(b));
    };
  }
  
  function getKey (val) { return val.key; }
  
  function recurse (position, val) {
    var parent = position.parent
    ,   after  = position.after;
    
    var expectedTypes = parent.properties().get('children').expectedTypes;
    _.each(expectedTypes, function (type) {
      var curr = val.get(type);
      if (curr) {
        curr.push(position);
      } else {
        val.set(type, [position]);
      }
    });
    
    if (after && after.properties().get('children')) {
      recurse(new Position(after, after.all('children').last()), val);
    }
    
    return val;
  }
  
  return recurse(position, new Data.Hash()).sort(on(compareByDefaultOrder, getKey));
}

function getTypeName (type) {
  return graph.get(type).name;
}

function moveTargetPositions (node, position) {
  function has (arr, el) {
    return arr.indexOf(el) >= 0;
  }
  
  function recurse (position, arr) {
    var parent = position.parent
    ,   after  = position.after;
    
    if (has(parent.properties().get('children').expectedTypes, node.type.key)) {
      arr.push(position);
    }
    
    if (after && after.properties().get('children')) {
      recurse(new Position(after, after.all('children').last()), arr);
    }
    
    return arr;
  }
  
  return recurse(position, []);
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
