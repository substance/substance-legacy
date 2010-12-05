var FacetController = Backbone.Controller.extend({
  routes: {
    'add_criterion/:property/:operator/:value': 'addCriterion',
    'remove_criterion/:property/:operator/:value': 'removeCriterion',
    'select_facet/:property': 'selectFacet'
  },

  initialize: function(options) {
  },

  selectFacet: function(property) {
    app.dashboard.browser.facets.select(property);
  },
  
  addCriterion: function(property, operator, value) {
    app.dashboard.browser.applyCommand({command: 'add_criterion', options: {
      property: property,
      operator: operator,
      value: value
    }});
    app.dashboard.browser.render();
  },
  
  removeCriterion: function(property, operator, value) {
    app.dashboard.browser.applyCommand({command: 'remove_criterion', options: {
      property: property,
      operator: operator,
      value: value
    }});
    app.dashboard.browser.render();
  }
});
