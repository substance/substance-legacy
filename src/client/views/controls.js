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


var Controls = Backbone.View.extend(_.extend({}, StateMachine, {

  className: 'controls',

  events: {
    'click .insert a': 'insert',
    'click .move a': 'move'
  },

  initialize: function (options) {
    this.root     = options.root;
    this.position = options.position;
  },

  insert: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var type = $(e.target).attr('data-type');
    createNode(type, this.position);
  },

  move: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.state === 'moveTarget') {
      removeChildTemporary(this.root.movedParent, this.root.movedNode);
      addChild(this.root.movedNode, this.position);
      this.root.transitionTo('write');
    }
  },

  render: function () {
    this.insertActions = $('<div class="actions insert" />').appendTo(this.el);
    $('<div class="placeholder" />').text("Insert Content").appendTo(this.insertActions);
    var insertMenu = $('<ul />').appendTo(this.insertActions);
    _.each(possibleChildTypes(this.model), _.bind(function (type) {
      var name = getTypeName(type);
      $('<li><a href="/" data-type="' + type + '">' + name + '</a></li>').appendTo(insertMenu);
    }, this));
    $('<br class="clear" />').appendTo(this.insertActions);
    
    this.moveActions = $('<div class="actions move" />').appendTo(this.el);
    $('<div class="placeholder" />').text("Move").appendTo(this.moveActions);
    var moveMenu = $('<ul />').appendTo(this.moveActions);
    $('<li><a href="/" class="move-node">Here</a></li>').appendTo(moveMenu);
    $('<br class="clear" />').appendTo(this.moveActions);
    
    return this;
  }

}), {

  states: {
    read: {},
    write: {},
    move: {},
    moveTarget: {}
  }

});
