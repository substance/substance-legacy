var ApplicationController = Backbone.Controller.extend({
  routes: {
    'add_criterion/:property/:operator/:value': 'addCriterion',
    'remove_criterion/:property/:operator/:value': 'removeCriterion',
    'select_facet/:property': 'selectFacet'
  },

  initialize: function() {
    
  },

  selectFacet: function(property) {
    app.facets.select(property);
  },
  
  addCriterion: function(property, operator, value) {
    app.applyCommand({command: 'add_criterion', options: {
      property: property,
      operator: operator,
      value: value
    }});
    app.render();
  },
  
  removeCriterion: function(property, operator, value) {
    app.applyCommand({command: 'remove_criterion', options: {
      property: property,
      operator: operator,
      value: value
    }});
    app.render();
  }
});
