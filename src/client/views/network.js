s.views.Network = Backbone.View.extend({

  events: {
    'click .join-network': '__joinNetwork',
    'click .leave-network': '__leaveNetwork',
    'click .toggle-documents': '__toggleDocuments',
    'click .toggle-members': '__toggleMembers',
    'change .image-file': '__upload'
  },

  __joinNetwork: function() {
    joinNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.reload();
    }, this));
    return false;
  },

  __leaveNetwork: function() {
    leaveNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.reload();
    }, this));
    return false;
  },

  __toggleDocuments: function() {
    this.mode = 'documents';
    this.render();
    this.$('.tab').removeClass('selected');
    this.$('.tab.toggle-documents').addClass('selected');
  },

  __toggleMembers: function() {
    this.mode = 'members';
    
    this.render();
    this.$('.tab').removeClass('selected');
    this.$('.tab.toggle-members').addClass('selected');
  },

  __upload: function() {
    this.$('.upload-image-form').submit();
  },

  initializeUploadForm: function () {
    _.bindAll(this, 'onStart', 'onProgress', 'onError');

    this.$('.upload-image-form').transloadit({
      modal: false,
      wait: true,
      autoSubmit: false,
      onStart: this.onStart,
      onProgress: this.onProgress,
      onError: this.onError,
      onSuccess: _.bind(function (assembly) {
        if (assembly.results.web_version &&
            assembly.results.web_version[1] &&
            assembly.results.web_version[1].url) {
          this.onSuccess(assembly);
        } else {
          this.onInvalid();
        }
      }, this)
    });
  },

  makeEditable: function() {
    var that = this;
    
    // Editor for network name
    this.$name = $('#network_header .title').unbind();
    
    this.$name.click(function() {
      editor.activate(that.$name, {
        placeholder: 'Enter Title',
        markup: false,
        multiline: false
      });

      editor.bind('changed', function() {
        that.model.network.set({
          name: editor.content()
        });
      });
    });

    // Editor for network description
    this.$descr = $('#network_header .descr').unbind();
    
    this.$descr.click(function() {
      editor.activate(that.$descr, {
        placeholder: 'Enter Sheet Description',
        controlsTarget: $('#sheet_editor_controls')
      });

      editor.bind('changed', function() {
        that.model.network.set({
          descr: editor.content()
        });
      });
    });
    this.initializeUploadForm();
  },

  onStart: function () {
    this.$('.image-progress').show();
    this.$('.image-progress .label').html("Uploading &hellip;");
    this.$('.progress-bar').css('width', '0%');
  },

  onProgress: function (bytesReceived, bytesExpected) {
    var percentage = Math.max(0, parseInt(bytesReceived / bytesExpected * 100));
    this.$('.image-progress .label').html("Uploading &hellip; " + percentage + "%");
    this.$('.progress-bar').css('width', percentage + '%');
  },

  onSuccess: function (assembly) {
    this.model.network.set({
      cover: assembly.results.web_version[1].url
    });
    
    this.$('.image-progress').hide();
    $('.upload-image-form img').attr('src', assembly.results.web_version[1].url);
  },

  onError: function (assembly) {
    // TODO
  },

  onInvalid: function () {
    this.$('.image-progress .label').html("Invalid image. Skipping &hellip;");
    this.$('.image-progress').hide();
    
    setTimeout(_.bind(function () {
      this.$('.info').show();
    }, this), 3000);
  },

  initialize: function(options) {
    this.documents = new s.views.Results({ model: this.model, id: "results" });
    this.members = new s.views.UserList({model: this.model, id: "members"});
    this.mode = "documents";
    _.bindAll(this, 'makeEditable');
  },

  reload: function() {
    loadNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.model = data;
      this.render();
    }, this));
  },

  render: function() {
    $(this.el).html(s.util.tpl('network', this.model));
    this.$(this[this.mode].render().el).appendTo(this.el);
    
    if (isCurrentUser(this.model.network.get('creator'))) {
      // TODO: do it properly
      setTimeout(this.makeEditable, 500);
    }
    return this;
  }
});
