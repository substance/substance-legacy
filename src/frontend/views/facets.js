var Facets = Backbone.View.extend({
  
  initialize: function() {
    this.selectedFacet = app.model.get('types', '/type/document').all('properties').first().key;
    this.facetChoices = {};
  },
  
  select: function(property) {
    this.selectedFacet = property;
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
    
    app.model.get('types', '/type/document').all('properties').each(function(property, key) {
      if (property.type !== 'number' && property.type !== 'collection' && property.key !== 'id') {
        var facet_choices = [];
        var selected_facet_choices = [];
        property.all("values").each(function(value) {
          if (that.facetChoices[key+'::CONTAINS::'+value.val] === true) {
            selected_facet_choices.push({excaped_value: escape(value.val), value: value.val, item_count: value.all('objects').length});
          } else {
            facet_choices.push({excaped_value: escape(value.val), value: value.val, item_count: value.all('objects').length});
          }
        });
        
        view.facets.push({
          property: key,
          property_name: property.name,
          facet_choices: facet_choices,
          selected_facet_choices: selected_facet_choices
        });
      }
    });
    
    return view;
  },
  
  render: function() {
    var that = this;
    $(this.el).html(_.renderTemplate('facets', this.buildView()));
    this.select(this.selectedFacet);
  }
});
