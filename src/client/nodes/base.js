var Node = Backbone.View.extend({

  className: 'content-node',

  attributes: {
    draggable: 'false'
  },

  initialize: function (options) {
    this.mode   = 'readonly';
    this.parent = options.parent;
    this.level  = options.level;
    this.root   = options.root;
    this.comments = new Node.Comments({ model: this.model.get('comments') });
  },


  // Events
  // ------

  events: {
    'click .toggle-comments': 'toggleComments',
    'click .remove-node': 'removeNode',
    'click .toggle-move-node': 'toggleMoveNode',
    
    'click': 'selectNode',
    'mouseover': 'highlight',
    'mouseout': 'unhighlight'
  },

  toggleComments: function () { this.comments.toggle(); },
  
  removeNode: function (e) {
    e.preventDefault();
    e.stopPropagation();
    removeChild(this.parent, this.model);
  },

  toggleMoveNode: function () {},

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


  readonly:  function () { this.mode = 'readonly'; },
  readwrite: function () { this.mode = 'readwrite'; },
  
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

  makeEditable: function (el, attr, dflt, options) {
    dflt = dflt || '';
    options = _.extend({
      placeholder: dflt,
      markup: false,
      multiline: false,
      codeFontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
    }, options || {});
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
        if (self.mode === 'readwrite') {
          window.editor.activate($(el), options);
          window.editor.bind('changed', function () {
            var update = {};
            update[attr] = window.editor.content();
            updateNode(self.model, update);
          });
        }
      });
    
    return $(el);
  },

  render: function () {
    $('<div class="content-node-outline"><div class="cursor"><span></span></div></div>').appendTo(this.el);
    this.operationsEl = $(
      '<div class="operations">' +
        '<a href="/" class="toggle-comments sticky" title="Toggle comments for Section"><span>' + this.model.get('comment_count') + '</span></a>' +
        '<a href="/" class="remove-node" title="Remove Node"></a>' +
        '<a href="/" class="toggle-move-node" title="Move Section — Use placeholders as targets"></a>' +
      '</div>'
    ).appendTo(this.el);
    //{{#edit}}<div class="pilcrow">&#182;</div>{{/edit}}
    this.contentEl = $('<div class="content" />').appendTo(this.el);
    this.commentsEl = $(this.comments.render().el).appendTo(this.el);
    return this;
  }

}, {

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


Node.Comments = Backbone.View.extend({

  className: 'comments-wrapper',

  initialize: function () {},

  toggle: function () {
    $(this.el).toggleClass('expanded');
  },

  render: function () {
    return this;
  }

});


/*
  <div class="handle">
    <a href="/">--&gt; INSERT</a>
  </div>
  <div class="actions">
    <div class="placeholder insert">Insert Content</div>
    <div class="placeholder move">Move</div>
    <% actions.each(function(action) { %>
        <% if (action.length === 0) return; %>
        <% if (action.length === 1) { %>
          <% _.each(action, function(v) { %>
            <span>
            <a href="/" type="<%= v.nodeType %>" destination="<%= destination %>" node="<%= v.node %>" parent="<%= v.parentNode %>" class="add add_<%= v.insertionType %>"><%= v.nodeTypeName %></a>
            </span>
          <% }); %>
        <% } else { %>
          <span class="container add">
          <%= action[0].nodeTypeName %>
          <div>
            <% _.each(action, function(v) { %>
              <a href="/" type="<%= v.nodeType %>" destination="<%= destination %>" node="<%= v.node %>" parent="<%= v.parentNode %>" class="add add_<%= v.insertionType %>">Level <%= v.level %></a>
            <% }); %>
          </div>
          </span>
        <% } %>
    <% }); %>
    
    <div class="move-targets">
      <!-- container node targets  -->
      <% _.each(path, function(n, index) { %>
        <span><a class="move-node container-node" href="/" node="<%= n._id %>" destination="<%= destination %>" level="<%= (index+1) %>"><!--<%= destination %>--> Here <!--&quot;<%= ContentNode.getTeaser(n).trim() %>&quot;--> at level <%= n.level %></a></span>
      <% }); %>
      
      <!-- allow child insertion for empty container nodes -->
      <% if (insertion_type === 'child' && node.level < 3) { %>
        <span><a class="move-node container-node <%= insertion_type %>" href="/" node="<%= node._id %>" destination="<%= destination %>"><!--Inside--> Here <!--&quot;<%= ContentNode.getTeaser(node).trim() %>&quot;--> at level <%= (node.level+1) %></a></span>
      <% } %>
      
      <!-- leaf node target  -->
      <span><a class="move-node leaf-node <%= insertion_type %>" href="/" node="<%= node._id %>" destination="<%= destination %>"><!--<%= insertion_type == "sibling" ? destination : "inside" %>--> Here <!--&quot;<%= ContentNode.getTeaser(node).trim() %>&quot;--></a></span>
    </div>
    
    <span class="message">
      
    </span>
    <br class="clear"/>
  </div>
*/


Node.Controls = Backbone.View.extend({

  className: 'controls',

  events: {
    'click .add': 'insert'
  },

  initialize: function (options) {
    this.position = options.position;
  },

  insert: function (event) {
    event.preventDefault();
    event.stopPropagation();
    var type = $(event.target).attr('data-type');
    createNode(type, this.position);
  },

  render: function () {
    var actions = $('<div class="actions" />').appendTo(this.el);
    $('<div class="placeholder insert" />').text("Insert Content").appendTo(actions);
    _.each(possibleChildTypes(this.model), function (type) {
      var name = type;
      $('<span><a href="/" data-type="' + type + '" class="add add_child">' + name + '</a></span>').appendTo(actions);
    });
    $('<br class="clear" />').appendTo(actions);
    return this;
  }

});


Node.NodeList = Backbone.View.extend({

  initialize: function (options) {
    this.level = options.level;
    this.root  = options.root;
    
    _.bindAll(this, 'addChild');
    this.model.bind('added-child', this.addChild);
    
    var childViews = this.childViews = [];
    this.model.get('children').each(_.bind(function (child) {
      childViews.push(this.createChildView(child));
    }, this));
  },

  eachChildView: function (fn) {
    _.each(this.childViews, fn);
  },

  readonly: function () {
    this.eachChildView(function (childView) {
      childView.readonly();
    });
  },

  readwrite: function () {
    this.eachChildView(function (childView) {
      childView.readwrite();
    });
  },

  //select: function () {},

  deselect: function () {
    this.eachChildView(function (childView) {
      childView.deselect();
    });
  },

  addChild: function (child, index) {
    var childView = this.createChildView(child)
    ,   rendered  = this.renderChildView(childView);
    
    console.log(child, index);
    
    this.childViews.splice(index, 0, childView);
    rendered.insertAfter(index === 0 ? this.firstControls.el
                                     : $(this.childViews[index-1].el).next());
    
    //setTimeout(function () {
    childView.readwrite();
    childView.select();
    childView.focus();
    //}, 500);
  },

  createChildView: function (child) {
    return Node.create({
      parent: this.model,
      model: child,
      level: this.level + 1,
      root: this.root
    });
  },

  renderChildView: function (childView) {
    var controls = new Node.Controls({
      model: this.model,
      position: { parent: this.model, after: childView.model }
    });
    var rendered = $([childView.render().el, controls.render().el]);
    var self = this;
    childView.model.bind('removed', function () {
      rendered.remove();
      // Remove childView from the childViews array
      self.childViews = _.select(self.childViews, function (cv) {
        return cv !== childView;
      });
    });
    return rendered;
  },

  render: function () {
    var self = this;
    
    this.firstControls = new Node.Controls({
      model: self.model,
      position: { parent: self.model, after: null }
    });
    $(this.firstControls.render().el).appendTo(self.el);
    
    this.eachChildView(function (childView) {
      var rendered = self.renderChildView(childView).appendTo(self.el);
    });
    
    return this;
  }

});
