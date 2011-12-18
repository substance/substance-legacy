// Provide top-level namespaces for our javascript.

var graph = new Data.Graph(seed, {dirty: false, syncMode: 'push'}).connect('ajax'); // The database

(function() {
  window.s = {};
  s.model = {};
  s.util = {};
  s.views = {};
  s.app = {};
}());
