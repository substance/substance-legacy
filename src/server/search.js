var request = require('request');
var _ = require('underscore');
var async = require('async');

function filterUsers (results) {
  return _.filter(results, function (result) {
    return result.type === '/type/user';
  });
}

var documentTypes = [
  '/type/document',
  '/type/section', '/type/text', '/type/quote', '/type/code',
  '/type/image', '/type/resource', '/type/question', '/type/answer'
];

function filterDocumentTypes (results) {
  return _.filter(results, function (result) {
    var type = result.type;
    for (var i = 0, l = type.length; i < l; i++) {
      if (documentTypes.indexOf(type[i]) >= 0) {
        return true;
      }
    }
    return false;
  });
}

function groupByDocument (results) {
  var idMap = {};
  var groups = [];
  _.each(results, function (result) {
    if (!result.document) return;
    if (idMap.hasOwnProperty(result.document)) {
      idMap[result.document].nodes.push(result);
    } else {
      groups.push(idMap[result.document] = {
        documentId: result.document,
        nodes: [result]
      });
    }
  });
  return groups;
}

function loadDocuments (groups, callback) {
  async.forEach(groups, function (group, cb) {
    db.get(group.documentId, function (err, node) {
      if (err) { cb(err); return; }
      delete group.documentId;
      group.document = node;
      if (node) {
        db.get(node.creator, function (err, user) {
          if (err) { cb(err); return; }
          group.creator = user;
          cb(null);
        });
      } else {
        cb(null);
      }
    });
  }, callback);
}

function filterGroups (groups) {
  // There could be nodes that belong to a document that has been deleted
  return _.filter(groups, function (group) {
    return group.document && group.document.published_version;
  });
}

exports.search = function (searchstr, callback) {
  request({
    url: config.elasticsearch_url + '/substance/substance/_search?q=' + encodeURI(searchstr)
  }, function (err, res, body) {
    if (err) { callback(err, null); return; }
    
    body = JSON.parse(body);
    var results = _.pluck(body.hits.hits, '_source');
    var users = filterUsers(results);
    var filtered = filterDocumentTypes(results);
    var groups = groupByDocument(filtered);
    loadDocuments(groups, function (err) {
      if (err) { callback(err, null); return; }
      callback(null, {
        users: users,
        documents: filterGroups(groups)
      });
    });
  });
};