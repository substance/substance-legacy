var Outline = function(graph) {
  var that = this;
  var root;
  
  var settings = {
    height: $('#outline').height(),
    width: $('#outline').width()
  };
  
  var scene = new uv.Scene({});

  var display = scene.display({
    container: 'outline',
    width: settings.width,
    height: settings.height
  });
  
  // A color per node type
  var colors = {
    'document': '#5D95A8',
    'section': '#729325',
    'text': '#336881',
    'image': '#814639'
  };
  
  var userColors = [
    '#000',
    '#666',
    '#222',
    '#ccc',
    '#444',
    '#eee',
  ];
  
  function userColor(user) {
    if (app.editor.status) {
      var idx = _.indexOf(app.editor.status.collaborators, user);
      return idx >= 0 ? userColors [idx] : '#000';
    }
    return '#000';
  }
  
  // NodeBar Actor
  // ---------------
  
  var Node = _.inherits(uv.Rect, {
    constructor: function(node, level, index, height) {
      var that = this;
         
      // Temporarily fix the scene reference problem
      that.scene = scene;
      
      // Super call
      uv.Rect.call(this, {
        id: node.key,
        x: 20,
        y: parseInt(index*height), // offset
        width: 8,
        height: parseInt(height)-2,
        interactive: true,
        lineWidth: function() {
          return this.active ? 2 : 0;
        },
        strokeStyle: function() {
          return colors[node.type];
        },
        fillStyle: function() {
          return colors[node.type];
        }
      });
      
      // Add node label
      // that.add({
      //   id: node.key+'_label',
      //   type: 'label',
      //   font: 'bold 12px Helvetica, Arial',
      //   text: function() {
      //     return node.data.name || node.type;
      //   },
      //   x: -10,
      //   y: 10,
      //   fillStyle: '#000',
      //   visible: function() {
      //     return this.parent.active;
      //   }
      // });
      
      
      // Cursor
      var cursor = that.add({
        id: node.key+'_cursor',
        type: 'path',
        fillStyle: 'green',
        lineWidth: 0,
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 15, y: 5 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
          { x: 0, y: 0 },
        ],
        x: -10,
        y: parseInt(height/2),
        
        fillStyle: function() {
          if (app.editor.status) {
            return userColor(app.editor.status.cursors[node.key]);
          }
          return '#000';
        },
        
        visible: function() {
          if (!app.editor.status) { // for unsynced docs
            return app.editor.model.selectedNode === node;
          }
          return app.editor.status.cursors[node.key];
        },
        actors: [
          // {
          //   type: 'label',
          //   text: function() {
          //     if (!app.editor.status) { // for unsynced docs
          //       return app.username;
          //     }              
          //     return app.editor.status.cursors[node.key];
          //   },
          //   // textAlign: 'right',
          //   x: -2,
          //   y: -5,
          //   fillStyle: '#000',
          // }
        ]
      });
      
      that.bind('click', function() {
        document.location.href = '#' + node.key;
        graph.selectNode(node.key);
      });
      
      var h = height / node.all('children').length;
      
      node.all('children').each(function(child, key, index) {
        that.add(new Node(child, level+1, index, h));
      });
    }
  });
  
  // Outline related
  // ---------------
  
  function build() {
    var n = new Node(graph, 0, 0, settings.height);
    scene.add(n);
  }
  
  // Build outline
  build();
  
  // Instance methods
  return {
    refresh: function() {
      scene.render();
    },
    
    render: function() {
      scene.start();
    }
  }
};

