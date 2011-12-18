s.views.Comments = Backbone.View.extend({

  className: 'comments-wrapper',

  events: {
    'click a.create-comment': 'createComment',
    'click a.remove-comment': 'removeComment',
    'click .comment-content': 'activateEditor'
  },

  initialize: function () {
    this.expanded = false;
  },

  toggle: function () {
    if (this.expanded) {
      this.contract();
    } else {
      this.expand();
    }
  },

  expand: function () {
    $(this.el).addClass('expanded');
    this.expanded = true;
    
    if (!this.comments) {
      this.load(_.bind(function () {
        this.scrollTo();
      }, this));
    } else {
      this.scrollTo();
    }
  },

  contract: function () {
    $(this.el).removeClass('expanded');
    this.expanded = false;
  },

  scrollTo: function () {
    var offset = $(this.el).offset();
    $('html, body').animate({ scrollTop: offset.top - 100 }, 'slow');
  },

  load: function (callback) {
    loadComments(this.model, _.bind(function (err, comments) {
      if (err) { return; }
      this.comments = comments;
      this.render();
      if (callback) { callback(); }
    }, this));
  },


  // Event Handlers
  // --------------

  createComment: function (e) {
    e.preventDefault();
    
    var node = this.model
    ,   content = this.commentEditor.content();
    
    var self = this;
    createComment(node, content, function () {
      self.load(function () {
        self.render();
      });
    });
  },

  removeComment: function (e) {
    e.preventDefault();
    
    var comment = graph.get($(e.currentTarget).attr('comment'));
    
    var self = this;
    removeComment(comment, function () {
      self.load(function () {
        self.render();
      });
    });
  },

  activateEditor: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var contentEl = this.$('.comment-content');
    this.commentEditor = new Proper();
    this.commentEditor.activate(contentEl, {
      multiline: true,
      markup: true,
      placeholder: "Enter Comment"
    });
  },

  // Render
  // ------

  render: function () {
    var wrapper = $(this.el)
    ,   comments = this.comments;
    
    if (comments) {
      wrapper.html(s.util.tpl('comments', {
        doc: this.model.get('document'),
        node: this.model,
        comments: comments
      }));
      
      // Update comment count (TODO)
      //var count = comments && comments.length > 0 ? comments.length : "";
      //$('#'+node.html_id+' > .operations a.toggle-comments span').html(count);
    }
    
    return this;
  }

});
