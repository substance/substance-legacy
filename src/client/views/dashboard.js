s.views.Dashboard = Backbone.View.extend({

  events: {
    'click .toggle-bin': '__toggleBin'
  },

  __toggleBin: function(e) {
    this.activeCategory = $(e.currentTarget).attr('data-category');
    this.activeBin = $(e.currentTarget).attr('data-bin');
    this.updateResults();
    this.render();
  },

  updateResults: function() {
    var docs = this.model.documents.select(_.bind(function(d) {
      return _.include(this.model.bins[this.activeCategory][this.activeBin].documents, d._id);
    }, this));

    this.results = new s.views.Results({ model: {documents: docs }, id: "results" });
  },

  initialize: function(options) {
    this.activeCategory = "user";
    this.activeBin = "user";
    this.updateResults();
  },

  render: function() {
    $(this.el).html(s.util.tpl('dashboard', {
      user: this.model.user,
      bins: this.model.bins,
      activeBin: this.activeBin
    }));
    
    this.$(this.results.render().el).appendTo(this.el);
    return this;
  }
});