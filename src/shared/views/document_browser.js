var DocumentBrowser = Backbone.View.extend({
  
  initialize: function(options) {
    var that = this;
    
    that.commands = [];
    
    // Initialize Facets View
    that.facets = new Facets({el: '#facets', browser: that});
    
    // Finally, render
    that.render();
  },
  
  render: function() {
    var documents = this.model.all('objects').toArray()
    this.el.html(_.renderTemplate('document_browser', {
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
