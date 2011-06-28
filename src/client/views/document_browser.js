var DocumentBrowser = Backbone.View.extend({
  events: {
    'click a.add-criterion': 'addCriterion',
    'click a.remove-criterion': 'removeCriterion'
  },
  
  addCriterion: function(e) {
    var property = $(e.currentTarget).attr('property'),
        operator = $(e.currentTarget).attr('operator'),
        value = $(e.currentTarget).attr('value');
    
    this.applyCommand({command: 'add_criterion', options: {
      property: property,
      operator: operator,
      value: value
    }});
    this.render();
    return false;
  },
  
  removeCriterion: function(e) {
    var property = $(e.currentTarget).attr('property'),
        operator = $(e.currentTarget).attr('operator'),
        value = $(e.currentTarget).attr('value');

    this.applyCommand({command: 'remove_criterion', options: {
      property: property,
      operator: operator,
      value: value
    }});
    this.render();
    return false;
  },
  
  initialize: function(options) {
    var that = this;
    this.app = options.app;
    this.browserTab = new BrowserTab({el: '#browser_tab', browser: this});
    this.documents = [];
    this.commands = [];
    
    this.graph = new Data.Graph(seed);
  },
  
  // Modfies query state (reflected in the BrowserTab)
  load: function(query) {
    var that = this;
    this.query = query;
    
    
    $('#browser_tab').show().html('&nbsp;&nbsp;&nbsp;Loading documents...');
    $('#browser_wrapper').html('');
    $.ajax({
      type: "GET",
      url: "/documents/search/"+query.type+"/"+encodeURI(query.value),
      dataType: "json",
      success: function(res) {
        that.graph.merge(res.graph);
        that.facets = new Facets({el: '#facets', browser: that});
        that.loaded = true;
        that.trigger('loaded');
        that.render();
      },
      error: function(err) {}
    });
  },
  
  render: function() {
    var that = this;
    if (this.loaded) {
      this.documents = this.graph.find({"type|=": "/type/document"});
      var DESC_BY_UPDATED_AT = function(item1, item2) {
        var v1 = item1.value.get('updated_at'),
            v2 = item2.value.get('updated_at');
        return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
      };
      
      this.documents = this.documents.sort(DESC_BY_UPDATED_AT);
      $(this.el).html(_.tpl('document_browser', {
        documents: this.documents,
        user: that.query.type === 'user' ? that.graph.get('/user/'+that.query.value) : null,
        query: that.query
      }));
      
      if (this.loaded) this.facets.render();
      this.browserTab.render();
    }
  },
  
  // Takes a command spec and applies the command
  applyCommand: function(spec) {
    var cmd;
    
    if (spec.command === 'add_criterion') {
      cmd = new AddCriterion(this, spec.options);
    } else if (spec.command === 'remove_criterion') {
      cmd = new RemoveCriterion(this, spec.options);
    }

    // remove follow-up commands (redo-able commands)
    if (this.currentCommand < this.commands.length-1) {
      this.commands.splice(this.currentCommand+1);
    }

    // insertion position
    var pos = undefined;
    $.each(this.commands, function(index, c) {
      if (c.matchesInverse(cmd)) {
        pos = index;
      }
    });

    if (pos >= 0) {
      // restore state
      this.commands[pos].unexecute();
      // remove matched inverse command
      this.commands.splice(pos, 1);
      // execute all follow-up commands [pos..this.commands.length-1]
      for (var i=pos; i < this.commands.length; i++) {
        this.commands[i].execute();
      }
    } else {
      this.commands.push(cmd);
      cmd.execute();
    }

    this.currentCommand = this.commands.length-1;
    return cmd;
  },
  
  undo: function() {
    if (this.currentCommand >= 0) {
      this.commands[this.currentCommand].unexecute();
      this.currentCommand -= 1;
      this.render();    
    }
  },

  redo: function() {
    if (this.currentCommand < this.commands.length-1) {
      this.currentCommand += 1;
      this.commands[this.currentCommand].execute();
      this.render();    
    }
  }
});
