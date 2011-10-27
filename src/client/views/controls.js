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
    'click .add': 'insert',
    'click .move-node': 'moveHere'
  },

  initialize: function (options) {
    this.root     = options.root;
    this.position = options.position;
  },

  moveHere: function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.state === 'moveTarget') {
      removeChildTemporary(this.root.movedParent, this.root.movedNode);
      addChild(this.root.movedNode, this.position);
      this.root.transitionTo('write');
    }
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
    $('<div class="placeholder move" />').text("Move").appendTo(actions);
    _.each(possibleChildTypes(this.model), function (type) {
      var name = type;
      $('<span><a href="/" data-type="' + type + '" class="add add_child">' + name + '</a></span>').appendTo(actions);
    });
    $('<div class="move-targets"><a href="/" class="move-node">Here</a></div>').appendTo(this.el);
    $('<br class="clear" />').appendTo(actions);
    return this;
  }

}), {

  states: {
    read: {},
    write: {},
    move: {
      enter: function (node, position) {
        if (canBeMovedHere(this.model, node)) {
          $(this.el).addClass('move-mode');
        }
      },
      leave: function () {
        $(this.el).removeClass('move-mode');
      }
    }
  }

});
