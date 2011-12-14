// Results view
// -------------

var Results = Backbone.View.extend({
  initialize: function(options) {
    this.documents = new Data.Hash();
		this.view = options.view;
  },
  
  render: function() {
	  
		if (this.documents.length > 0) {			
      $('#browser_content').html(_.tpl('browser_results', {
        documents: this.documents,
        user: this.view.query.type === 'user' ? this.view.graph.get('/user/'+this.view.query.value) : null,
        query: this.view.query
      }));
			
		} else {
			$('#browser_content').html("Loading ...");
		}
  }
});


// Browser Modes
// -------------

var BrowserModes = {};

BrowserModes["user"] = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;
    this.results = new Results({view: this});
  },
  
  load: function(query) {
    var that = this;
    this.query = query;
    
    $.ajax({
      type: "GET",
      url: "/documents/search/"+query.type+"/"+encodeURI(query.value),
      dataType: "json",
      success: function(res) {
        that.graph = new Data.Graph(seed);
        that.graph.merge(res.graph);
				// Populate results
        that.results.documents = that.graph.find({"type|=": "/type/document"});
	      var DESC_BY_UPDATED_AT = function(item1, item2) {
	        var v1 = item1.value.get('updated_at'),
	            v2 = item2.value.get('updated_at');
	        return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
	      };
		      
	      that.results.documents = that.results.documents.sort(DESC_BY_UPDATED_AT);
				
        that.loaded = true;
        that.trigger('loaded');
        that.results.render();
      },
      error: function(err) {}
    });
  },
  
  render: function() {
    // Populate shelf accordingly
    $('#browser_shelf').html(_.tpl('browser_user'), {
      
    });
    
		// Render results
    this.results.render();
  }
});


BrowserModes["explore"] = Backbone.View.extend({
  render: function() {
    $('#browser_shelf').html(_.tpl('browser_explore'));
  }
});


BrowserModes["search"] = Backbone.View.extend({
  render: function() {
    $('#browser_shelf').html(_.tpl('browser_search'));
  }
});


// Browser
// -------------

var Browser = Backbone.View.extend({
  events: {
    'click .views .browser.view': 'toggleView'
  },
  
  initialize: function(options) {
    this.app = options.app;
    this.selectedView = "user";
    this.documents = [];
    this.graph = new Data.Graph(seed);
    this.view = new BrowserModes[this.selectedView]({browser: this});
  },
  
  // Handlers
  // -------------
  
  toggleView: function(e) {
    this.navigate($(e.currentTarget).attr('view'))
  },
  
  
  // Methods
  // -------------
  
  navigate: function(view) {
		this.$('.views .browser.view').removeClass('selected');
		
    $('.browser.view.'+view).addClass('selected');
    this.selectedView = view;
		this.view = new BrowserModes[this.selectedView]({browser: this});
		if (this.selectedView === "user") this.view.load({"type": "user", "value": app.username});
		
		this.view.render();
		
		$('#browser_shelf').css('height', $('#browser_shelf .shelf-content').height());
		$('#browser_content').css('margin-top', $('#browser_shelf .shelf-content').height()+100);
  },
  
  render: function() {
    // Render parent view
    $(this.el).html(_.tpl('browser', {
      selectedView: this.selectedView
    }));
  }
  
});
