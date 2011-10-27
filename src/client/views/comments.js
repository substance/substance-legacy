var Comments = Backbone.View.extend({

  className: 'comments-wrapper',

  initialize: function () {},

  toggle: function () {
    $(this.el).toggleClass('expanded');
  },

  render: function () {
    return this;
  }

});
