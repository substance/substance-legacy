var Node = Backbone.View.extend(_.extend({}, StateMachine, {

  className: 'content-node',

  attributes: {
    draggable: 'false'
  },

  initialize: function (options) {
    this.state    = 'read';
    this.parent   = options.parent;
    this.level    = options.level;
    this.root     = options.root;
    this.comments = new Comments({ model: this.model });
    
    $(this.el).attr({ id: this.model.html_id });
  },


  // Events
  // ------

  events: {
    'click .toggle-comments':  'toggleComments',
    'click .remove-node':      'removeNode',
    'click .toggle-move-node': 'toggleMoveNode',
    
    'click': 'selectNode',
    'mouseover': 'highlight',
    'mouseout': 'unhighlight'
  },

  toggleComments: function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.comments.toggle();
  },
  
  removeNode: function (e) {
    e.preventDefault();
    e.stopPropagation();
    removeChild(this.parent, this.model);
  },

  toggleMoveNode: function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.state === 'move') {
      this.root.transitionTo('write');
    } else {
      // There could be another node that is currently in move state.
      // Transition to read state to make sure that no node is in move state.
      this.root.transitionTo('read');
      this.transitionTo('move');
      
      this.root.movedNode = this.model;
      this.root.movedParent = this.parent;
      this.root.transitionTo('moveTarget');
    }
  },

  selectNode: function (e) {
    // the parent view shouldn't deselect this view when the event bubbles up
    e.stopPropagation();
    this.select();
  },

  highlight: function (e) {
    e.preventDefault();
    $(this.el).addClass('active');
  },

  unhighlight: function (e) {
    e.preventDefault();
    $(this.el).removeClass('active');
  },

  select: function (e) {
    if (this.root) {
      this.root.deselect();
    } else {
      this.deselect();
    }
    $(this.el).addClass('selected');
  },

  deselect: function () {
    $(this.el).removeClass('selected');
  },

  focus: function () {},

  makeEditable: function (el, attr, dflt, options, updateFn) {
    dflt = dflt || '';
    options = _.extend({
      placeholder: dflt,
      markup: false,
      multiline: false,
      codeFontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
    }, options || {});
    updateFn = updateFn || function (node, attr, val) {
      var update = {};
      update[attr] = val;
      updateNode(node, update);
    };
    
    var self = this;
    
    var value = this.model.get(attr);
    if (value) {
      if (options.markup) {
        $(el).html(value);
      } else {
        $(el).text(value);
      }
    } else {
      $(el).text(dflt).addClass('empty');
    }
    
    $(el)
      .attr({ title: "Click to Edit" })
      .click(function () {
        if (self.state === 'write') {
          window.editor.activate($(el), options);
          window.editor.bind('changed', function () {
            updateFn(self.model, attr, window.editor.content());
          });
        }
      });
    
    return $(el);
  },

  render: function () {
    $('<div class="content-node-outline"><div class="cursor"><span></span></div></div>').appendTo(this.el);
    this.operationsEl = $(
      '<div class="operations">' +
        '<a href="/" class="toggle-comments sticky" title="Toggle comments for Section"><span>' + (this.model.get('comment_count') || "") + '</span></a>' +
        '<a href="/" class="remove-node" title="Remove Node"></a>' +
        '<a href="/" class="toggle-move-node" title="Move Section — Use placeholders as targets"></a>' +
      '</div>'
    ).appendTo(this.el);
    //{{#edit}}<div class="pilcrow">&#182;</div>{{/edit}}
    this.contentEl = $('<div class="content" />').appendTo(this.el);
    this.commentsEl = $(this.comments.render().el).appendTo(this.el);
    return this;
  },


  // States
  // ------


}), {

  states: {
    read: {
      enter: function () {},
      leave: function () {}
    },
    
    write: {
      enter: function () {},
      leave: function () {}
    },

    move: {
      enter: function () {
        $(this.el).addClass('being-moved'); // TODO
      },
      leave: function (nextState) {
        if (nextState === 'moveTarget') { return false; }
        $(this.el).removeClass('being-moved'); // TODO
      }
    },

    moveTarget: {
      enter: function () {},
      leave: function () {}
    }
  },

  subclasses: {},

  define: function (types, name, protoProps, classProps) {
    classProps = classProps || {};
    protoProps.name = classProps.name = name;
    var subclass = this.extend(protoProps, classProps);
    
    function toArray (a) { return _.isArray(a) ? a : [a] }
    _.each(toArray(types), function (type) {
      this.subclasses[type] = subclass;
    }, this);
    
    return subclass;
  },

  create: function (options) {
    var model = options.model
    ,   type = model.type._id
    ,   Subclass = this.subclasses[type];
    
    if (!Subclass) { throw new Error("Node has no subclass for type '"+type+"'"); }
    return new Subclass(options);
  }

});
