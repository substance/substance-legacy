// Results view
// -------------

var Results = Backbone.View.extend({
  initialize: function(options) {
    this.documents = new Data.Hash();
		this.subview = options.subview;
  },
  
  render: function() {
	  
		if (this.documents.length > 0) {			
      $('#browser_content').html(_.tpl('browser_results', {
        documents: this.documents,
        user: this.subview.query.type === 'user' ? this.subview.graph.get('/user/'+this.subview.query.value) : null,
        query: this.subview.query
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
    this.results = new Results({subview: this});
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
    'click .modes .mode': 'switchMode'
  },
  
  initialize: function(options) {
    this.app = options.app;
    this.mode = "user";
    this.documents = [];
    this.graph = new Data.Graph(seed);
    this.subview = new BrowserModes[this.mode]({browser: this});
  },
  
  switchMode: function(e) {
		this.mode = $(e.currentTarget).attr('mode');
		this.$('.modes .mode').removeClass('selected');
		$(e.currentTarget).addClass('selected');
		this.subview = new BrowserModes[this.mode]({browser: this});
		if (this.mode === "user") this.subview.load({"type": "user", "value": app.username});
		this.render();
  },
  
  render: function() {
    // Render parent view
    $(this.el).html(_.tpl('browser', {
      mode: this.mode
    }));
    
    this.subview.render();
  }
  
});
