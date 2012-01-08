s.views.Search = Backbone.View.extend({
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
      
      _.each(res, function (group) {
        group.document = graph.set(group.document._id, group.document);
        group.nodes = _.map(group.nodes, function (node) {
          return graph.set(node._id, node);
        });
      });
      
      console.log(err, res);
      
      var resultsEl = this.$('#results').html('');
      
      if (res.length === 0) {
        $('<p />').text("No results.").appendTo(resultsEl);
        return;
      }
      
      $('<p />')
        .text(res.length + (res.length == 1 ? " result" : " results"))
        .appendTo(resultsEl);
      
      _.each(res, function (group) {
        var doc = group.document;
        var nodes = group.nodes;
        var resultEl = $('<div class="result" />').appendTo(resultsEl);
        $('<h2 />').text(doc.get('title')).appendTo(resultEl);
        _.each(nodes, function (node) {
          var view = s.views.Node.create({
            model: node
          });
          $(view.render().el).appendTo(resultEl);
        });
      });
    }, this));
  }
});
