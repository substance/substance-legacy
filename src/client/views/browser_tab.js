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
    }, 200);
  },
  
  // Performs a search on the document repository based on a search string
  // Returns a list of matching user names and one entry for matching documents
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
               that.$('.results').append($('<a href="#search/'+encodeURI($('#search').val())+'" class="result-item documents">'+res.document_count+' Documents / '+_.keys(res.users).length+' Users</a>'));
               _.each(res.users, function(user, key) {
                 that.$('.results').append($('<a href="#'+user.username+'" class="result-item user"><div class="username">'+user.username+'</div><div class="full-name">'+(user.name ? user.name : '')+'</div><div class="count">User</div></a>'));
               });
               $('#browser_tab .results').show();
             },
             error: function(err) {}
           });
        }
        // Sanitize on every registered change
      }, 500);
    }
  },
  
  // Finally perform a real search
  loadDocuments: function() {
    app.searchDocs($('#search').val());
    this.active = false;
    return false;
  },
  
  loadUser: function() {
    
  },
  
  initialize: function(options) {
    this.browser = options.browser;
  },
  
  render: function() {
    var queryDescr;
    
    if (this.browser.query) {
      switch (this.browser.query.type){
        case 'user': queryDescr = this.browser.query.value+"'s documents"; break;
        case 'recent': queryDescr = 'Recent Documents'; break;
        default : queryDescr = 'Documents for &quot;'+this.browser.query.value+'&quot;';
      }
    } else {
      queryDescr = 'Type to search ...';
    }
    
    $(this.el).html(_.tpl('browser_tab', {
      documents: this.browser.documents,
      query_descr: queryDescr
    }));
  }
});

