/*
<div id="<%= node.html_id %>" name=<%= node.key %> parent="<%= parent._id %>" level="<%= level %>" draggable="false" class="content-node text level-<%= level %>">
  <div class="content-node-outline"><div class="cursor"><span></span></div></div>
  
  <div class="operations">
    <a href="/" class="toggle-comments sticky" title="Toggle comments for Text"><span><%= comments %></span></a>
    <% if (edit) { %>
      <a href="/" class="remove-node" title="Remove Node" node="<%= node.key %>" parent="<%= parent._id %>"></a>
      <a href="/" class="toggle-move-node" title="Move Text — Use placeholders as targets"></a>
    <% } %>
  </div>
  
  <% if (edit) { %><div class="pilcrow">&#182;</div> <% } %>
  
  <div class="content<%= empty ? " empty" : "" %>"<%= empty ? 'title="Click To Edit Text"' : "" %>>
    <%= empty ? "<p>&laquo; Enter Text &raquo;</p>" : content %>
  </div>
  <% if (edit) { %><div class="node-editor-placeholder"></div><% } %>
  <div class="comments-wrapper <%= !edit ? "expanded" : ""%>"></div>
</div>
*/


Node.define('/type/text', 'Text', {

  className: 'content-node text',

  initialize: function () {
    Node.prototype.initialize.apply(this, arguments);
  },

  //select: function () {
  //  Node.prototype.select.apply(this);
  //},

  //deselect: function () {},

  render: function () {
    Node.prototype.render.apply(this, arguments);
    this.textEl = this.makeEditable($('<div />'), 'content', "Enter Text", {
      markup: true,
      multiline: true,
      controlsTarget: $(this.el)
    }).appendTo(this.contentEl);
    return this;
  }

});
