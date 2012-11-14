sc.views.Node.define('text', _.extend(Textish, {

  className: 'content-node text',

  types: {
    "em": {
      "description": 'Emphasize',
      "inclusive": true,
      "visibility" : 'both'
    },
    "str": {
      "description": 'Strong',
      "inclusive": true,
      "visibility" : 'both'
    },
    "idea": {
      "description": 'Idea',
      "inclusive": false,
      "visibility" : 'both'
    },
    "blur": {
      "description": 'Question',
      "inclusive": false,
      "visibility" : 'both'
    },
    "doubt": {
      "description": 'Doubt',
      "inclusive": false,
      "visibility" : 'both'
    }
  },

  // This should be moved into a separate module
  events: {
    'mousedown .annotation-tools .toggle': 'toggleAnnotation',
    'click .annotation-tools .toggle': function() { return false; }
  },

  initialize: function (options) {
    sc.views.Node.prototype.initialize.apply(this, arguments);
  },

  // Deal with incoming update
  update: function() {
    // TODO: implement
  },

  render: function() {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
}));