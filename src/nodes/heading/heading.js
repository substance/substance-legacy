sc.views.Node.define('heading', _.extend(Textish, {

  className: 'content-node heading',

  // This should be moved into a separate module
  events: {
    'mousedown .annotation-tools .toggle': 'toggleAnnotation',
    'click .annotation-tools .toggle': function() { return false; }
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