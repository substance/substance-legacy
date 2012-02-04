// DocumentLens
// -------------

s.views.DocumentLens = Backbone.View.extend({

  id: 'document_lens',

  events: {
    'click a': 'scrollTo'
  },

  initialize: function (options) {
    _.bindAll(this);
    
    this.selectedItem = 0;
    this.start = 0;
    this.windowSize = 9;
    this.height = 270;
  },

  scrollTo: function (e) {
    var node = $(e.currentTarget).attr('href').slice(1);
    app.scrollTo(node);
    return false;
  },

  getBounds: function() {
    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    start = clamp(this.selectedItem-(this.windowSize-1)/2, 0, this.model.items.length-this.windowSize);
    return [start, start+this.windowSize-1];
  },

  render: function () {
    var bounds = this.getBounds();
    var that = this;
    $(this.el).html(s.util.tpl('document_lens', {
      items: this.model.items,
      bounds: bounds,
      selectedItem: this.selectedItem
    }));

    // Good?
    this.$('.items').mouseleave(function() {
      that.render();
    });

    this.$('.items').scroll(function(e) {
      e.preventDefault();
      e.stopPropagation();

      start = Math.round($(this).scrollTop()/30);
      $('.outline .outline-item').removeClass('active').each(function(i) {
        if (i>=start && i<=start+that.windowSize-1) {
          $(this).addClass('active');
        }
      });
      return false;
    });

    this.$('.items').scrollTop(bounds[0]*30);

    var delta = this.height/this.model.items.length;
    this.$('.outline .outline-item').height(delta);

    return this;
  }
});