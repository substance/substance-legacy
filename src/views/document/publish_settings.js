sc.views.PublishSettings = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .add-publication': 'addPublication',
    'click .delete-publication': 'deletePublication',
    'click .create-version': 'createVersion',
    'click .unpublish-document': 'unpublish',
  },

  createVersion: function() {
    var that = this;
    this.model.createVersion(function(err) {
      that.trigger('publish_state:updated');
      that.render();
    });
    return false;
  },

  unpublish: function() {
    var that = this;
    this.model.unpublish(function(err) {
      that.trigger('publish_state:updated');
      that.render();
    });
    return false;
  },

  addPublication: function(e) {
    var network = $('#substance_networks').val();
    var that = this;
    this.model.createPublication(network, function(err) {
      that.render();
    });
    return false;
  },

  deletePublication: function(e) {
    var network = $(e.currentTarget).attr('data-id');
    var that = this;
    this.model.deletePublication(network, function(err) {
      that.render();
    });
    return false;
  },

  // Handlers
  // --------

  // Make sure view is populated with data before rendering it
  render: function() {
    if (this.model.networks) {
      this.$el.html(_.tpl('publish_settings', this.model));  
    } else {
      this.$el.html('loading...');
    }
    
    return this;
  }
});