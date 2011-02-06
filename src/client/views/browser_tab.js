var BrowserTab = Backbone.View.extend({
  events: {
    'submit #search_form': 'loadDocuments',
    'keydown #search': 'search',
    'focus #search': 'focusSearch',
    'blur #search': 'blurSearch'
  },
  
  focusSearch: function(e) {
    this.searchValue = $(e.currentTarget).val();
    
    this.active = true;
    $(e.currentTarget).val('');
  },
  
  blurSearch: function(e) {
    var that = this;
    this.active = false;
    setTimeout(function() {
      that.render();
    }, 100);
  },
  
  // Performs a search on the document repository based on a search string
  // Returns a list of matching user names and one entry for matching documents
  // Eg. Search: "Jo"
  // - 10 matching documents for "Jo"
  // - Johannes (20 documents)
  // - Mojo (50 documents)
  search: function(e) {
    
    if (e.keyCode === 27) return this.blurSearch();
    var that = this;
    
    if ($('#search').val() === '') return;
    
    if (!that.pendingSearch) {
      that.pendingSearch = true;
      setTimeout(function() {
        that.pendingSearch = false;
        
        if (that.active && $('#search').val() !== '') {
          
          $.ajax({
             type: "GET",
             url: "/search/"+encodeURI($('#search').val()),
             dataType: "json",
             success: function(res) {               
               // Render results
               that.$('.results').html('');
               that.$('.results').append($('<div class="result-item documents"><a href="#search/'+encodeURI($('#search').val())+'">'+res.document_count+' matching Documents</div></div>'));
               
               _.each(res.users, function(user, key) {
                 that.$('.results').append($('<div class="result-item user"><div class="username">'+user.username+'</div><div class="full-name">'+(user.name ? user.name : '')+'</div><div class="count">User</div></div>'));
               });
               
               $('#browser_tab .results').show();
             },
             error: function(err) {}
           });
        }
        // Sanitize on every registered change
      }, 1000);
    }
  },
  
  // Finally perform a real search
  loadDocuments: function() {
    app.browser.load({"type": "search", "value": $('#search').val()});
    app.toggleView('browser');
    controller.saveLocation('#search/'+encodeURI($('#search').val()));
    this.active = false;
    return false;
  },
  
  loadUser: function() {
    
  },
  
  initialize: function(options) {
    this.browser = options.browser;
  },
  
  render: function() {
    var queryDescr = this.browser.query.type === 'user'
                     ? this.browser.query.value+"'s documents"
                     : 'Documents for &quot;'+this.browser.query.value+'&quot;';
      
    $(this.el).html(_.tpl('browser_tab', {
      documents: this.browser.documents,
      query_descr: queryDescr
    }));
  }
});

