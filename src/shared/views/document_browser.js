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
    
    that.commands = [];
    this.load();
    
  },
  
  load: function() {
    var that = this;
    graph.fetch(this.options.query, {expand: false}, function(err, g) {
      
      if (err) alert('An error occured during fetching the documents');
      
      // Initialize Facets View
      that.facets = new Facets({el: '#facets', browser: that});
      
      that.render();
    });
  },
  
  render: function() {
    var documents = graph.find({'type': '/type/document'}).toArray();
    
    _.each(documents, function(doc) {
      doc.username = doc.value.data.creator.split('/')[2]
    });
    
    $(this.el).html(_.renderTemplate('document_browser', {
      num_documents: documents.length,
      documents: documents
    }));
    
    this.facets.render();
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
