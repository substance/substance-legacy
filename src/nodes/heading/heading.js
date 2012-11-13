sc.views.Node.define('heading', _.extend(Textish, {

  className: 'content-node heading',

  // This should be moved into a separate module
  events: {
    'click .annotation-tools .toggle': 'toggleAnnotation'
  },

  types: {
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
      "description": 'Doubt',
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

  // DO WE NEED THIS?
  initialize: function (options) {
    sc.views.Node.prototype.initialize.apply(this, arguments);
  },

  render: function () {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
}));