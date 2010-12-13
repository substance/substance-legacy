var ApplicationController = Backbone.Controller.extend({
  routes: {
    ':username/:docname': 'loadDocument'
  },

  initialize: function() {
    
  },
  
  loadDocument: function(username, docname) {
    app.document = new DocumentView({
      el: '#document_wrapper',
      id: 'users:'+username+':documents:'+docname
    });
  }
});


var Application = Backbone.View.extend({
  
  events: {
    'click a.load-document': 'loadDocument',
    'click #shelf': 'showDocument',
    'click #browser_toggle': 'showBrowser',
    'click #document_toggle': 'showDocument'
  },
  
  loadDocument: function(e) {
    this.document = new DocumentView({
      el: '#document_wrapper',
      id: $(e.currentTarget).attr('document')
    });
    
    controller.saveLocation($(e.currentTarget).attr('href'));
    return false;
  },
  
  showDocument: function() {
    this.toggleView('document');
  },
  
  showBrowser: function() {
    this.toggleView('browser');
  },
  
  initialize: function(options) {
    var that = this;
    
    this.shelf = new Shelf({el: '#sbs_shelf'});
    
    $.ajax({
      url: '/documents.json',
      dataType: 'json',
      success: function(documents) {
        var graph = new Data.Graph(documents);
        
        // Init DocumentBrowser
        that.browser = new DocumentBrowser({
          el: '#browser',
          model: graph
        });

        that.render();
      },
      error: function() {
        alert('An error occured during fetching the documents');
      }
    });
    
  },
  
  // Toggle between document view and browser
  toggleView: function(view) {
    this.view = view;
    $('#sbs_header').removeClass();
    
    if (view === 'document') {
      $('#document_wrapper').show();
      $('#browser').hide();
      $('#sbs_header').addClass('document');
      
    } else {
      $('#browser').show();
      $('#document_wrapper').hide();
      $('#sbs_header').addClass('browser');
    }
  },
  
  render: function() {    
    this.browser.render();
    this.shelf.render();
  }
});

var app, controller;

(function() {
  $(function() {
    // Start the browser
    app = new Application({el: $('#container')});
    
    // Register controller
    controller = new ApplicationController({app: app});
    Backbone.history.start();
  });
})();