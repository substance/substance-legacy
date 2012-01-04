function renderTOC (node, root) {
  root = root || node;
  var content = '';
  
  content += '<ol>';
  node.all('children').each(function (child) {
    if (child.type.key !== '/type/section') return;
    
    content += '<li>'
             +    '<a href="#'+child.html_id+'">'
             +      child.get('name')
             +    '</a>'
             +   renderTOC(child, root)
             + '</li>';
  });
  content += '</ol>';
  
  return content;
}


s.views.TOC = Backbone.View.extend({

  id: 'toc',

  events: {
    'click a': 'scrollTo'
  },

  scrollTo: function (e) {
    var node = $(e.currentTarget).attr('href').slice(1);
    app.scrollTo(node);
    app.toggleTOC();
  },

  render: function () {
    $(this.el).html(renderTOC(this.model));
    return this;
  }

});
