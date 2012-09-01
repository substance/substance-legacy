sc.views.Node.define('text', {

  className: 'content-node text',

  focus: function () {
    $(this.textEl).click();
  },

  select: function () {
    sc.views.Node.prototype.select.apply(this);
  },

  deselect: function () {
    sc.views.Node.prototype.deselect.apply(this);
  },

  // Deal with incoming update
  update: function() {
    // this.editor.setValue(this.model.content);
  },

  initSurface: function() {
    var that = this;

    this.surface = new Substance.Surface({
      el: this.$('.content'),
      content: this.model.content,
      annotations: [{
        "id": "a:1",
        "type": "comment",
        "pos": [0,4],
        "properties": {"content": "This is a comment for you"}
      }]
    });

    // Emphasis
    key('ctrl+alt+cmd+e', _.bind(function() {
      that.surface.apply(["insert", {"type": "em"}]);
    }, this));

    // Strong
    key('ctrl+shift+s', _.bind(function() { 
      that.surface.apply(["insert", {"type": "str"}]);
    }, this));

    // Add Comment / just for testing purposes
    key('ctrl+shift+c', _.bind(function() {
      that.surface.apply(["insert", {"type": "comment", "attributes": {"content": "Hey I'm a comment"}}]);
    }, this));

    // Events
    // ------

    // Returns all annotations matching that selection
    this.surface.on('selection:change', function(sel) {
      console.log('selection:change', sel, that.surface.selection());
    });

    this.surface.on('surface:active', function(sel) {
      app.view.model.select([that.model.id], {edit: true});
    });

    this.surface.on('text:change', function(content, prevContent) {
      var delta = _.extractOperation(prevContent, content);

      console.log("Partial Text Update", delta);

      var op = {
        op: ["update", {id: that.model.id, "delta": delta}],
        user: "michael"
      };

      that.document.apply(op);
    });
  },

  render: function() {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
});