var request = require('request');
var _ = require('underscore');
var async = require('async');

var allowedTypes = [
  '/type/document',
  '/type/section', '/type/text', '/type/quote', '/type/code',
  '/type/image', '/type/resource', '/type/question', '/type/answer'
];

function filterTypes (results) {
  return _.filter(results, function (result) {
    var type = result.type;
    for (var i = 0, l = type.length; i < l; i++) {
      if (allowedTypes.indexOf(type[i]) >= 0) {
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
      cb(null);
    });
  }, callback);
}

function filterGroups (groups) {
  // There could be nodes that belong to a document that has been deleted
  return _.filter(groups, function (group) {
    return !!group.document;
  });
}

exports.search = function (searchstr, callback) {
  request({
    url: config.elasticsearch_url + '/substance/substance/_search?q=' + encodeURI(searchstr)
  }, function (err, res, body) {
    if (err) { callback(err, null); return; }
    
    body = JSON.parse(body);
    var results = _.pluck(body.hits.hits, '_source');
    var filtered = filterTypes(results);
    var groups = groupByDocument(filtered);
    loadDocuments(groups, function (err) {
      console.log(groups);
      if (err) { callback(err, null); return; }
      callback(null, filterGroups(groups));
    });
  });
};