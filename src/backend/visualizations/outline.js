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
  
  // NodeBar Actor
  // ---------------
  
  var Node = _.inherits(uv.Rect, {
    constructor: function(node, level, index, height) {
      var that = this;
         
      // Fix the scene reference problem
      that.scene = scene;
      
      // Super call
      uv.Rect.call(this, {
        id: node.key,
        x: 20,
        y: index*height, // offset
        width: 10,
        height: height-2,
        interactive: true,
        fillStyle: function() {
          return this.active ? '#444' : '#777';
        }
      });
      
      // Add node label
      that.add({
        id: node.key+'_label',
        type: 'label',
        text: function() {
          return node.data.name || node.type;
        },
        x: -10,
        y: height / 2,
        fillStyle: '#000',
        visible: function() {
          return this.parent.active;
        }
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
    render: function() {
      scene.start();
    }
  }
};

