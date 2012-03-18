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
    this.windowSize = 12;
    this.height = this.windowSize * 30;
  },

  scrollTo: function (e) {
    var node = $(e.currentTarget).attr('href').slice(1);
    var index = $(e.currentTarget).attr('data-index');
    app.scrollTo(node);
    setTimeout(_.bind(function() {
      this.selectSection(index);
      // TODO: view dependency alert
      this.model.document.prevSection = index;
    }, this), 40);
    
    return false;
  },

  getBounds: function() {
    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    start = clamp(this.selectedItem-(this.windowSize-1)/2, 0, this.model.items.length-this.windowSize);
    return [start, start+this.windowSize-1];
  },

  selectSection: function(item) {
    this.selectedItem = item;

    this.$('.items .item.selected').removeClass('selected');
    this.$($('.items .item')[item]).addClass('selected');
    this.$('.outline .outline-item').removeClass('selected');
    this.$($('.outline .outline-item')[item]).addClass('selected');
    this.$('.items').scrollTop(this.getBounds()[0]*30);
  },

  render: function () {
    var bounds = this.getBounds();
    var that = this;
    $(this.el).html(s.util.tpl('document_lens', {
      items: this.model.items,
      bounds: bounds,
      selectedItem: this.selectedItem
    }));

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
    var delta = Math.min(this.height/this.model.items.length, 30);
    this.$('.outline .outline-item').height(delta);

    return this;
  }
});