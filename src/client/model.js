// Document
// ========

function createDoc (type, name, title) {
  var docType = graph.get(type);
  var doc = graph.set(Data.uuid('/document/'+app.username+'/'), docType.meta.template);
  doc.set({
    creator: '/user/' + app.username,
    created_at: new Date(),
    updated_at: new Date(),
    name: name,
    title: title
  });
  return doc;
}


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
  
  return newNode;
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
  return after === null ? children.clone()
                        : slice(children, children.index(after._id) + 1);
}

function addFollowingSiblings (position, section) {
  var parent = position.parent;
  var stop = false;
  getFollowingSiblings(position).each(function (sibling, ii, i) {
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
}

function possibleChildTypes (position, level) {
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
  
  function recurse (position, val, level) {
    var parent = position.parent
    ,   after  = position.after;
    
    var expectedTypes = parent.properties().get('children').expectedTypes;
    _.each(expectedTypes, function (type) {
      if (!(type === '/type/section' && level > 3)) {
        var curr = val.get(type);
        if (curr) {
          curr.push(position);
        } else {
          val.set(type, [position]);
        }
      }
    });
    
    if (after && after.properties().get('children')) {
      recurse(new Position(after, after.all('children').last()), val, level + 1);
    }
    
    return val;
  }
  
  return recurse(position, new Data.Hash(), level).sort(on(compareByDefaultOrder, getKey));
}

function getTypeName (type) {
  return graph.get(type).name;
}

function moveTargetPositions (node, position, level) {
  function has (arr, el) {
    return arr.indexOf(el) >= 0;
  }
  
  function depth (n) {
    return isSection(n)
         ? 1 + Math.max(_.max(_.map(n.all('children').values(), depth)), 0)
         : 0;
  }
  
  var maxLevel = 4 - depth(node);
  
  function recurse (position, arr, level) {
    var parent = position.parent
    ,   after  = position.after;
    
    if (level > maxLevel) { return arr; }
    
    if (has(parent.properties().get('children').expectedTypes, node.type.key)) {
      arr.push(position);
    }
    
    if (after && after.properties().get('children')) {
      recurse(new Position(after, after.all('children').last() || null), arr, level + 1);
    }
    
    return arr;
  }
  
  return recurse(position, [], level);
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
    document: node.get('document')._id
    // TODO:
    //version: this.version ? '/version/'+this.model._id.split('/')[3]+'/'+this.version : null
  });
  
  // Trigger immediate sync
  graph.sync(function (err) {
    window.pendingSync = false;
    if (err) callback(err, null);
    else     callback(null, comment);
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

function loadDocument (username, docname, version, callback) {
  $.ajax({
    type: "GET",
    url: version ? "/documents/"+username+"/"+docname+"/"+version : "/documents/"+username+"/"+docname,
    dataType: "json",
    success: function (res) {
      if (res.error) {
        callback(res.error, null);
      } else {
        graph.merge(res.graph);
        callback(null, {
          version: res.version,
          authorized: res.authorized,
          published: res.published,
          doc: graph.get(res.id)
        });
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}


function sortDocuments (documents) {
  var DESC_BY_UPDATED_AT = function(item1, item2) {
    var v1 = item1.value.get('updated_at'),
        v2 = item2.value.get('updated_at');
    return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
  };
  return documents.sort(DESC_BY_UPDATED_AT);
}


function loadDocuments (query, callback) {
  this.query = query;
  
  $.ajax({
    type: "GET",
    url: "/documents/search/"+query.type+"/"+encodeURI(query.value),
    dataType: "json",
    success: function (res) {
      var graph = new Data.Graph(seed);
      graph.merge(res.graph);
      
      // Populate results
      var documents = graph.find({"type|=": "/type/document"});

      callback(null, {
        documents: sortDocuments(documents),
        user: query.type === "user" ? graph.get('/user/'+query.value) : null
      });
    },
    error: function(err) {
      callback(err);
    }
  });
}

function loadDashboard (query, callback) {
  this.query = query;
  
  $.ajax({
    type: "GET",
    url: "/dashboard.json",
    dataType: "json",
    success: function (res) {
      
      var graph = new Data.Graph(seed);
      graph.merge(res.graph);
      
      // Populate results
      var documents = graph.find({"type|=": "/type/document"});
      
      callback(null, {
        documents: sortDocuments(documents),
        user: graph.get('/user/'+session.username)
      });
    },
    error: function(err) {
      callback(err);
    }
  });
}

function loadExplore (callback) {
  var graph = new Data.Graph(seed).connect('ajax');

  $.ajax({
    type: "GET",
    url: "/documents/search/recent/50",
    dataType: "json",
    success: function (res) {
      graph.merge(res.graph);

      // Populate results
      var documents = graph.find({"type|=": "/type/document"});
      
      graph.fetch({type: "/type/network"}, function(err, nodes) {
        err ? callback(err) : callback(null, {
          networks: nodes,
          documents: sortDocuments(documents)
        });
      });
    },
    error: function(err) {
      callback(err);
    }
  });
}

function loadNetwork (network, callback) {
  $.ajax({
    type: "GET",
    url: "/network/"+network+".json",
    dataType: "json",
    success: function (res) {
      var graph = new Data.Graph(seed);
      graph.merge(res.graph);

      callback(null, {
        members: graph.find({"type": "/type/user"}),
        network: graph.find({"type": "/type/network"}).first(),
        documents: graph.find({"type": "/type/document"}),
        isMember: res.isMember
      });
    },
    error: function(err) {
      callback(err);
    }
  });
}


function search (queryString, callback) {
  // TODO
  callback(null, null);
}


// Document
// ========

// var Document = {};
// 
// 
// Document.getUsername = function() {
//   return app.username;
// }
// 
// 
// Document.isHead = function(doc) {
//   return !doc.version;
// }
// 
// Document.isAuthorized = function(doc) {
//   // 
// }
//

function documentURL(doc) {
  return "" + doc.get('creator')._id.split("/")[2] + "/" + doc.get('name');
}

function deleteDocument (doc, callback) {
  graph.del(doc._id);
  setTimeout(function () {
    callback(null);
  }, 300);
  notifier.notify(Notifications.DOCUMENT_DELETED); // TODO
}

function checkDocumentName (name, callback) {
  if (new RegExp(graph.get('/type/document').get('properties', 'name').validator).test(name)) {
    // TODO: find a more efficient way to check for existing docs.
    $.ajax({
      type: "GET",
      url: "/documents/"+app.username+"/"+name,
      dataType: "json",
      success: function(res) {
        callback(res.status === 'error');
      },
      error: function(err) {
        callback(true); // Not found. Fine.
      }
    });
  } else {
    callback(false);
  }
}

function updateDocumentName (doc, name, callback) {
  checkDocumentName(name, function (valid) {
    if (valid) {
      doc.set({ name: name });
      callback(null);
    } else {
      callback(new Error('Sorry, this name is already taken.'));
    }
  });
}

function subscribeDocument (doc, callback) {
  graph.set(null, {
    type: '/type/subscription',
    user: '/user/'+app.username,
    document: doc._id
  });
  
  doc.set({
    subscribed: true,
    subscribers: doc.get('subscribers') + 1
  });
  doc._dirty = false;
  
  setTimeout(function () {
    callback(null);
  }, 300);
}

function unsubscribeDocument (doc, callback) {
  graph.fetch({
    type: '/type/subscription',
    user: '/user/'+app.username,
    document: doc._id
  }, function (err, nodes) {
    graph.del(nodes.first()._id);
    doc.set({
      subscribed: false,
      subscribers: doc.get('subscribers') - 1
    });
    doc._dirty = false;
    
    callback(err);
  });
}


function loadPublish (doc, callback) {
  function byCreatedAt (item1, item2) {
    var v1 = item1.value.get('created_at')
    ,   v2 = item2.value.get('created_at');
    return v1 === v2 ? 0 : (v1 < v2 ? -1 : 1);
  }
  
  graph.fetch({ type: '/type/version', document: doc._id }, function (err, versions) {
    if (err) {
      callback(err, null);
      return;
    }
    graph.fetch({ type: '/type/network' }, function (err, availableNetworks) {
      if (err) return callback(err, null);

      graph.fetch({type: '/type/publication', document: doc._id}, function(err, publications) {
        if (err) return callback(err, null);
        var networks = new Data.Hash();
        publications.each(function(pub) {
          var networkId = pub.get('network')._id;
          networks.set(networkId, availableNetworks.get(networkId));
        });

        callback(null, {
          versions: versions.sort(byCreatedAt),
          availableNetworks: availableNetworks,
          networks: networks,
          document: doc
        });
      });
    });
  });
}

function publishDocument (doc, networks, remark, callback) {
  $.ajax({
    type: 'POST',
    url: '/publish',
    data: JSON.stringify({
      document: doc._id,
      networks: networks,
      remark: remark
    }),
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      if (res.error) {
        callback(res.error, null);
      } else {
        callback(null, res);
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}

function removeVersion(document, version, callback) {
    window.pendingSync = true;
    graph.del(version);
    
    // Trigger immediate sync
    graph.sync(function (err) {
      window.pendingSync = false;
      callback(null);
    });
}

/*
// Extract available documentTypes from config
function documentTypes () {
  var result = [];
  graph.get('/config/substance').get('document_types').each(function(type, key) {
    result.push({
      type: key,
      name: graph.get(key).name
    });
  });
  return result;
}
*/

// Network
// ========

function networkSlug (network) {
  return network._id.split('/')[2];
}

function joinNetwork (network, callback) {
  $.ajax({
    type: "POST",
    url: "/network/"+network+"/join",
    dataType: "json",
    success: function (res) {
      callback(null);
    },
    error: function (err) {
      callback(err);
    }
  });
}


function leaveNetwork (network, callback) {
  $.ajax({
    type: "PUT",
    url: "/network/"+network+"/leave",
    dataType: "json",
    success: function (res) {
      callback(null);
    },
    error: function (err) {
      callback(err);
    }
  });
}

// User
// ====

function login (username, password, callback) {
  $.ajax({
    type: "POST",
    url: "/login",
    data: {
      username: username,
      password: password
    },
    dataType: "json",
    success: function (res) {
      if (res.status === 'error') {
        callback({ error: "authentication_failed" }, null);
      } else {
        graph.merge(res.seed);
        app.username = res.username; // TODO
        callback(null, res.username);
      }
    },
    error: function (err) {
      callback({ error: "authentication_failed" }, null);
    }
  });
}

function logout (callback) {
  $.ajax({
    type: "POST",
    url: "/logout",
    dataType: "json",
    success: function (res) {
      callback(null);
    },
    error: function (err) {
      callback(err);
    }
  });
}

function createUser (username, name, email, password, callback) {
  $.ajax({
    type: "POST",
    url: "/register",
    data: {
      username: username,
      name: name,
      email: email,
      password: password
    },
    dataType: "json",
    success: function (res) {
      res.status === 'error' ? callback('error', res) : callback(null, res);
    },
    error: function (err) {
      console.log("Unknown error. Couldn't create user.")
      //callback(err);
    }
  });
}

function requestPasswordReset (username, callback) {
  $.ajax({
    type: 'POST',
    url: '/recover_password',
    data: {
      username: username
    },
    dataType: 'json',
    success: function (res) {
      if (res.error) {
        callback(res.error, null);
      } else {
        callback(null, res);
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}

function resetPassword (username, tan, password, callback) {
  $.ajax({
    type: 'POST',
    url: '/reset_password',
    data: {
      username: username,
      tan: tan,
      password: password
    },
    dataType: 'json',
    success: function (res) {
      if (res.status === 'error') {
        callback(new Error(res.message), null);
      } else {
        callback(null, res);
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}

function loggedIn () {
  return !!(app || session).username;
}

function currentUser () {
  return graph.get('/user/'+session.username);
}

function isCurrentUser (user) {
  return (app || session).username === user.get('username');
}


// Collaboration
// -------------

function invite (email, doc, mode, callback) {
  $.ajax({
    type: 'POST',
    url: '/invite',
    data: {
      email: email,
      document: doc._id,
      mode: mode
    },
    dataType: 'json',
    success: function (res) {
      if (res.error) {
        callback(res.error);
      } else {
        callback(null);
      }
    },
    error: function (err) {
      callback(err);
    }
  });
}

function getCollaborators (doc, callback) {
  graph.fetch({
    type: '/type/collaborator',
    document: doc._id
  }, function (err, nodes) {
    callback(err, nodes);
  });
}

function removeCollaborator (collaboratorId, callback) {
  window.pendingSync = true;
  graph.del(collaboratorId);
  
  // trigger immediate sync
  graph.sync(function (err) {
    window.pendingSync = false;
    //that.collaborators.del(collaboratorId);
    callback(err);
  });
}

function changeCollaboratorMode (collaboratorId, mode, callback) {
  window.pendingSync = true;
  
  graph.get(collaboratorId).set({
    mode: mode
  });
  
  // trigger immediate sync
  graph.sync(function (err) {
    window.pendingSync = false;
    callback(err);
  });
}


// Notifications
// =============

function getNotifications () {
  var username = session.username;
  var notifications = graph.find({"type|=": "/type/notification", "recipient": "/user/"+username});

  var SORT_BY_DATE_DESC = function(v1, v2) {
    var v1 = v1.value.get('created_at'),
        v2 = v2.value.get('created_at');
    return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
  }
  
  return notifications.sort(SORT_BY_DATE_DESC);
}

function loadNotifications (callback) {
  $.ajax({
    type: "GET",
    url: "/notifications",
    dataType: "json",
    success: function (notifications) {
      var newNodes = {};
      _.each(notifications, function (n, key) {
        // Only merge in if not already there
        if (!graph.get(key)) {
          newNodes[key] = n;
        }
      });
      graph.merge(newNodes);
      callback(null);
    }
  });
}
