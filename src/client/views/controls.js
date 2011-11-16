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
    this.state    = 'read';
    this.root     = options.root;
    this.position = options.position;
  },

  transitionTo: function (state) {
    StateMachine.transitionTo.call(this, state);
    this.render();
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
    $(this.el).html(this.invokeForState('render'));
    return this;
  }

}), {

  states: {
    read: {
      render: function () {
        return '';
      }
    },
    write: {
      render: function () {
        var types = possibleChildTypes(this.model)
        ,   names = _.map(types, getTypeName)
        ,   childTypes = _.zip(types, names);
        
        return _.tpl('controls-insert', {
          childTypes: childTypes
        });
      }
    },
    move: {
      render: function () {
        return _.tpl('controls-move', {});
      }
    },
    moveTarget: {
      render: function () {
        return _.tpl('controls-movetarget', {});
      }
    }
  }

});
