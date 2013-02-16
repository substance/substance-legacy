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

  message: function(msg) {
    var that = this;
    this.$('.message').show();
    this.$('.message').html(msg);

    _.delay(function() {
      that.hideMessage();
    }, 2000);
  },

  hideMessage: function() {
    this.$('.message').hide();
  },

  handleFileSelect: function(evt) {
    var that = this;
    evt.stopPropagation();
    evt.preventDefault();

    // from an input element
    var filesToUpload = evt.target.files;
    var file = filesToUpload[0];

    this.message('Processing Image ...');

    // TODO: display error message
    if (!file.type.match('image.*')) return this.message('Not an image. Skipping ...');

    var img = document.createElement("img");
    var reader = new FileReader();

    reader.onload = function(e) {
      img.src = e.target.result;

      _.delay(function() {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var MAX_WIDTH = 800;
        var MAX_HEIGHT = 1000;
        var width = img.width;
        var height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        var dataurl = canvas.toDataURL("image/png");

        // Debug stuff
        console.log({
          original: img.src,
          thumb: dataurl
        });

        that.document.apply(["update", {id: that.model.id, "data": {
          "content": dataurl,
          "filename": file.name
        }}]);

        that.render(); // re-render the node;

      }, 800);
    }

    reader.readAsDataURL(file);
  },

  render: function () {
    var that = this;
    sc.views.Node.prototype.render.apply(this, [true]);

    // Inject some image related stuff
    this.$('.content').append('<input type="file" class="files" name="files[]"/><div class="message"></div>');
    
    if (that.model.content) {
      that.$('.content').append(['<img class="thumb" src="', that.model.content,
                                 '" title="', escape(that.model.filename), '"/>'].join(''));
    }

    this.$('.content').append('<div class="placeholder">Drop image here</div>');

    _.delay(function() {
      that.$('.files').bind('change', function(e) {
        that.handleFileSelect(e);
      });
    }, 200);
    return this;
  }
});