s.views.Search = Backbone.View.extend({
  id: 'search',
  
  events: {
    'submit form': 'performSearch'
  },
  
  render: function() {
    $(this.el).html(s.util.tpl('search'));
    return this;
  },
  
  performSearch: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var searchstr = this.$('#search_string').val();
    
    search(searchstr, _.bind(function (err, res) {
      if (err) { console.log(err); return; }
      
      console.log(err, res);
      
      this.$('#results').html(s.util.tpl('search_results', {
        users: res.users,
        documents: res.documents
      }));
    }, this));
  }
});
