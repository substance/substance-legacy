s.views.Network = Backbone.View.extend({

  events: {
    'click .join-network': '__joinNetwork',
    'click .leave-network': '__leaveNetwork',
    'click .toggle-documents': '__toggleDocuments',
    'click .toggle-members': '__toggleMembers'
  },

  __joinNetwork: function() {
    joinNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.reload();
    }, this));
    return false;
  },

  __leaveNetwork: function() {
    leaveNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.reload();
    }, this));
    return false;
  },

  __toggleDocuments: function() {
    this.mode = 'documents';
    this.render();
    this.$('.tab').removeClass('selected');
    this.$('.tab.toggle-documents').addClass('selected');
  },

  __toggleMembers: function() {
    this.mode = 'members';
    
    this.render();
    this.$('.tab').removeClass('selected');
    this.$('.tab.toggle-members').addClass('selected');
  },

  initialize: function(options) {
    this.documents = new s.views.Results({ model: this.model, id: "results" });
    this.members = new s.views.UserList({model: this.model, id: "members"});
    this.mode = "documents";
  },

  reload: function() {
    loadNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.model = data;
      this.render();
    }, this));
  },

  render: function() {
    $(this.el).html(s.util.tpl('network', this.model));
    this.$(this[this.mode].render().el).appendTo(this.el);
    return this;
  }
});
