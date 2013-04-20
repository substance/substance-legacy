sc.views.Node.define('text', _.extend(Textish, {

  className: 'content-node text',

  types: {
    "emphasis": {
      "description": 'Emphasis',
      "inclusive": true,
      "visibility" : 'both'
    },
    "strong": {
      "description": 'Strong',
      "inclusive": true,
      "visibility" : 'both'
    },
    "inline-code": {
      "description": 'Code',
      "inclusive": true,
      "visibility" : 'both'
    },
    "link": {
      "description": 'Link',
      "inclusive": true,
      "visibility" : 'both'
    },
    "idea": {
      "description": 'Idea',
      "inclusive": false,
      "visibility" : 'both'
    },
    "question": {
      "description": 'Question',
      "inclusive": false,
      "visibility" : 'both'
    },
    "error": {
      "description": 'Error',
      "inclusive": false,
      "visibility" : 'both'
    }
  },

  // This should be moved into a separate module
  events: {
    'mousedown .annotation-tools .toggle': 'toggleAnnotation',
    'click .annotation-tools .toggle': function() { return false; },
    'change .annotation-tools .link-url': 'updateLink',
    // In order to prevent from bubbeling down to the document node underneath
    'click .annotation-tools': function() { return false; },
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