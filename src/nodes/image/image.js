sc.views.Node.define('image', {

  className: 'content-node image',

  // This should be moved into a separate module
  events: {
    // 'mousedown .annotation-tools .toggle': 'toggleAnnotation',
    // 'click .annotation-tools .toggle': function() { return false; }
  },

  // DO WE NEED THIS?
  initialize: function (options) {
    sc.views.Node.prototype.initialize.apply(this, arguments);
  },

  handleFileSelect: function(evt) {
    var that = this;
    evt.stopPropagation();
    evt.preventDefault();

    console.log('MEEH', evt);
    var files = evt.target.files; // FileList object.
    var f = files[0];


    // Only process image files.
    if (!f.type.match('image.*')) {
      // continue;
      return;
    }

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
      return function(e) {
        that.$('.content').append(['<img class="thumb" src="', e.target.result,
                                   '" title="', escape(theFile.name), '"/>'].join(''));
      };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
  },

  render: function () {
    var that = this;
    sc.views.Node.prototype.render.apply(this, [true]);

    // Inject some image related stuff
    this.$('.content').append('<input type="file" id="files" name="files[]" multiple />');
    
    _.delay(function() {
      document.getElementById('files').addEventListener('change', function(evt) {
        that.handleFileSelect(evt);
      }, false);  
    }, 200);
    
    return this;
  }
});