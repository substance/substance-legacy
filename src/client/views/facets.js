var Facets = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;
    this.facetChoices = {};
    this.el = '#facets';
  },
  
  select: function(property) {
    $('.facet').removeClass('selected');
    $('#facet_'+property).toggleClass('selected');
  },
  
  addChoice: function(property, operator, value) {
    // TODO: build flexible lookup for arbitrary operators (GT, LT etc.)
    this.facetChoices[property+'::'+operator+'::'+value] = true;
  },
  
  removeChoice: function(property, operator, value) {
    delete this.facetChoices[property+'::'+operator+'::'+value];
  },
  
  buildView: function() {
    var that = this;
    var view = {facets: []};
    
    // Properties for all registered document_types
    var properties = new Data.Hash();
    app.browser.graph.get('/config/substance').get('document_types').each(function(type, key) {
      properties = properties.union(app.browser.graph.get(type).properties());
    });
    
    app.browser.graph.get('/type/document').all('properties').each(function(property, key) {
      if (property.meta.facet) {
        var facet_choices = [];
        var selected_facet_choices = [];
        property.all("values").each(function(value) {
          if (that.facetChoices[key+'::CONTAINS::'+value._id] === true) {
            selected_facet_choices.push({key: escape(value._id), value: value.toString(), item_count: value.referencedObjects.length});
          } else {
            facet_choices.push({key: escape(value._id), value: value.toString(), item_count: value.referencedObjects.length});
          }
        });
        
        if (facet_choices.length + selected_facet_choices.length > 0) {
          view.facets.push({
            property: key,
            property_name: property.name,
            facet_choices: facet_choices,
            selected_facet_choices: selected_facet_choices
          });
        }
      }
    });
    return view;
  },
  
  render: function() {
    var that = this;
    $(this.el).html(_.renderTemplate('facets', this.buildView()));
  }
});
