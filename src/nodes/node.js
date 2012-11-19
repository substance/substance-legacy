sc.views.Node = Dance.Performer.extend(_.extend({}, s.StateMachine, {

  className: 'content-node',

  attributes: {
    draggable: 'false'
  },

  initialize: function (options) {
    this.state  = 'read';
    this.document = options.document;
    this.session = options.session;
    $(this.el).attr({ id: _.htmlId(this.model) });
  },

  transitionTo: function (state) {
    StateMachine.transitionTo.call(this, state);
    if (this.state === state) {
      this.afterControls.transitionTo(state);
    }
  },

  // Dispatching a change
  dispatch: function() {
    dispatch(this.serializeUpdate());
  },

  // No-op
  annotate: function(type) {
    // To be overriden by concrete nodes
  },

  // Events
  // ------

  focus: function () {},

  render: function () {
    var cnt = this.document.comments(this.model.id).length;
    var annotations = [];

    // _.each(this.document.annotations(this.model.id), function(a) {
    //   annotations.push('<a href="#" class="'+a.type+'"></a>');
    // });

    $(this.el).html('<div class="content" contenteditable="true"></div><div class="handle"><a href="#" class="up move" title="Move Selection Up (ALT + ▲)"></a><a href="#" class="move down" title="Move Selection Down (ALT + ▼)"></a></div><div class="handle-2"></div><a href="#" class="delete" title="Delete Selection (←)"></a> <a href="#" class="comments-toggle'+(cnt > 0 ? ' active' : '')+'">'+''+'</a><div class="annotation-tools"></div><div class="annotations">'+annotations.join('')+'</a></div>');
    return this;
  }
}), {

  // States
  // ------

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

  // Inheritance & Instantiation
  // ---------------------------

  subclasses: {},

  define: function (types, protoProps, classProps) {
    classProps = classProps || {};
    var subclass = this.extend(protoProps, classProps);
    
    function toArray (a) { return _.isArray(a) ? a : [a] }
    _.each(toArray(types), function (type) {
      this.subclasses[type] = subclass;
    }, this);
    
    return subclass;
  },

  create: function (options) {
    var model = options.model,
        type = model.type,
        Subclass = this.subclasses[type];
    
    if (!Subclass) { throw new Error("Node has no subclass for type '"+type+"'"); }
    return new Subclass(options);
  }

});