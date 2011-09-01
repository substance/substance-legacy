var ConfirmCollaboration = Backbone.View.extend({
  
  events: {
    "click a.option-tab": "selectOption",
    "submit #login-form": "login",
    "submit #signup-form": "register",
    "submit #confirm-form": "doConfirm"
  },
  
  initialize: function(tan) {
    var that = this;
    this.el = '#content_wrapper';
    this.tan = tan;
    
    graph.fetch({"type": "/type/collaborator", "tan": this.tan, "document": {}}, function(err, nodes) {
      if (err) alert('An error occured.');
      that.document = nodes.select(function(n) {
        return n.types().get('/type/document');
      }).first();
      that.collaborator = nodes.select(function(n) {
        return n.types().get('/type/collaborator');
      }).first();
      that.render();
    });
  },
  
  selectOption: function(e) {
    var option = $(e.currentTarget).attr('option');
    this.$('.option').removeClass('active');
    this.$('.option-tab').removeClass('active');
    this.$('.option.'+option).addClass('active');
    this.$('.option-tab.'+option).addClass('active');
    return false;
  },
  
  doConfirm: function() {
    var that = this;
    this.confirm(function(err) {
      if (err) return alert('Collaboration could not be confirmed. '+err.error);
      
      router.loadDocument(that.document.get('creator')._id.split('/')[2], that.document.get('name'));
    });
    return false;
  },

  confirm: function(callback) {
    $.ajax({
      type: "POST",
      url: "/confirm_collaborator",
      data: {
        tan: this.tan,
        user: app.username
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return callback({error: res.error});
        callback(null);
      },
      error: function(err) {
        callback({error: "Error occurred"});
      }
    });
  },
  
  login: function(e) {
    var that = this;
    app.authenticate(this.$('.username').val(), this.$('.password').val(), function(err) {
      if (err) return notifier.notify(Notifications.AUTHENTICATION_FAILED);
      that.trigger('authenticated');
      app.render();
      that.confirm(function(err) {
        if (err) return alert('Collaboration could not be confirmed. '+err.error);
        router.loadDocument(that.document.get('creator')._id.split('/')[2], that.document.get('name'));
      });
    });
    return false;
  },
  
  register: function() {
    var that = this;
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    app.createUser($('#signup_user').val(), $('#signup_name').val(), $('#signup_email').val(), $('#signup_password').val(), function(err, res) {
      if (err) {
        if (res.field === "username") {
          $('#signup_user').addClass('error');
          $('#signup_user_message').html(res.message);
        } else {
          $('#registration_error_message').html(res.message);
        }
      } else {
        graph.merge(res.seed);
        notifier.notify(Notifications.AUTHENTICATED);
        app.username = res.username;          
        that.trigger('authenticated');
        app.render();
        
        that.confirm(function(err) {
          if (err) return alert('Collaboration could not be confirmed. '+err.error);
          router.loadDocument(that.document.get('creator')._id.split('/')[2], that.document.get('name'));
        });
      }
    });
    return false;
  },
  
  render: function() {    
    $(this.el).html(_.tpl('confirm_collaboration', {
      collaborator: this.collaborator,
      document: this.document
    }));
    this.delegateEvents();
  }
});
