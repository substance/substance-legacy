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
      "description": 'Blur',
      "inclusive": false,
      "visibility" : 'both'
    },
    "doubt": {
      "description": 'Blur',
      "inclusive": false,
      "visibility" : 'both'
    }
  },

  // annotationTypes: [
  //   {"type": "em", "active": false, description: "Emphasize" },
  //   {"type": "str", "active": false, description: "Strong" },
  //   {"type": "idea", "active": false, description: "Idea" },
  //   {"type": "blur", "active": false, description: "Question" },
  //   {"type": "doubt", "active": false, description: "Doubt" }
  // ],

  // This should be moved into a separate module
  events: {
    'click .annotation-tools .toggle': 'toggleAnnotation',
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