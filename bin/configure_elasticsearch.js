var fs = require('fs');
var url = require('url');
var request = require('request');

var config = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf-8'));

var fragments  = url.parse(config.couchdb_url)
,   couch_user = fragments.auth ? fragments.auth.split(':')[0] : null
,   couch_pass = fragments.auth ? fragments.auth.split(':')[1] : null
,   couch_host = fragments.hostname
,   couch_port = fragments.port
,   couch_db   = fragments.pathname.replace(/^\//, '');



console.log(couch_host, couch_port, couch_db);
createSchema(function (err) {
  console.log(err);
  createRiver(function (err) {
    console.log(err);
  });
});

function createSchema (callback) {
  request.put({
    url: config.elasticsearch_url + '/substance/substance/_mapping',
    json: {
      properties: {
        type: { type: 'string' }
      }
    }
  }, function (err, res, body) {
    callback(err);
  });
}

function createRiver (callback) {
  request.put({
    url: config.elasticsearch_url + '/_river/substance_river/_meta',
    json: {
      type: 'couchdb',
      couchdb: {
        user: couch_user,
        password: couch_pass,
        host: couch_host,
        port: couch_port,
        db: couch_db,
        filter: null
      },
      index: {
        index: 'substance',
        type: 'substance'
      }
    }
  }, function (err, res, body) {
    //console.log(err, res, body);
    callback(err);
  });
}