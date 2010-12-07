//     (c) 2010 Michael Aufreiter
//     Proper is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/michael/proper

(function(){

  // Use Underscore namespace for helpers
  if (!_) this._ = {};
  
  // _.Events (taken from Backbone.js)
  // -----------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may `bind` or `unbind` a callback function to an event;
  // `trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.bind('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  
  _.Events = Backbone ? Backbone.Events : {

    // Bind an event, specified by a string name, `ev`, to a `callback` function.
    // Passing `"all"` will bind the callback to all events fired.
    bind : function(ev, callback) {
      var calls = this._callbacks || (this._callbacks = {});
      var list  = this._callbacks[ev] || (this._callbacks[ev] = []);
      list.push(callback);
      return this;
    },

    // Remove one or many callbacks. If `callback` is null, removes all
    // callbacks for the event. If `ev` is null, removes all bound callbacks
    // for all events.
    unbind : function(ev, callback) {
      var calls;
      if (!ev) {
        this._callbacks = {};
      } else if (calls = this._callbacks) {
        if (!callback) {
          calls[ev] = [];
        } else {
          var list = calls[ev];
          if (!list) return this;
          for (var i = 0, l = list.length; i < l; i++) {
            if (callback === list[i]) {
              list.splice(i, 1);
              break;
            }
          }
        }
      }
      return this;
    },

    // Trigger an event, firing all bound callbacks. Callbacks are passed the
    // same arguments as `trigger` is, apart from the event name.
    // Listening for `"all"` passes the true event name as the first argument.
    trigger : function(ev) {
      var list, calls, i, l;
      if (!(calls = this._callbacks)) return this;
      if (list = calls[ev]) {
        for (i = 0, l = list.length; i < l; i++) {
          list[i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
      }
      if (list = calls['all']) {
        for (i = 0, l = list.length; i < l; i++) {
          list[i].apply(this, arguments);
        }
      }
      return this;
    }

  };


  // Initial Setup
  // -------------

  controlsTpl = ' \
    <div class="proper-commands"> \
      <a href="/" class="command strong" command="strong"><div>Bold</div></a> \
      <a href="/" class="command em" command="em"><div>Emphasis</div></a> \
      <div class="separator">|</div> \
      <a href="/" class="command ul" command="ul"><div>Bullets List</div></a> \
      <a href="/" class="command ol" command="ol"><div>Numbered List</div></a> \
      <a href="/" class="command indent" command="indent"><div>Indent</div></a> \
      <a href="/" class="command outdent" command="outdent"><div>Outdent</div></a> \
      <div class="separator">|</div> \
      <a href="/" class="command link" command="link"><div>Link</div></a> \
    </div> \
  ';
  
  // Proper
  // -----------
  
  this.Proper = function(options) {
    var activeElement = null,     // element that is being edited
        $commands,
        self = {},
        that = this;
    
    // Commands
    // -----------
    
    var commands = {
      execEM: function() {
        document.execCommand('italic', false, true);
        return false;
      },

      execSTRONG: function() {
        document.execCommand('bold', false, true);
        return false;
      },

      execUL: function() {
        document.execCommand('insertUnorderedList', false, null);
        return false;
      },

      execOL: function() {
        document.execCommand('insertOrderedList', false, null);
        return false;
      },

      execINDENT: function() {
        document.execCommand('indent', false, null);
        return false;
      },

      execOUTDENT: function() {
        document.execCommand('outdent', false, null);
        return false;
      },
      
      execLINK: function() {
        document.execCommand('CreateLink', false, prompt('URL:'));
        return false;
      },

      showHTML: function() {
        alert($(this.el).html());
      }
    };

    
    // Instance methods
    // -----------

    self.deactivate = function() {
      $(activeElement).attr('contenteditable', 'false');
      $controls.hide();
      self.unbind('changed');
    }
    
    // Activate editor for a given element
    self.activate = function(el) {
      
      if (el !== activeElement) {
        // Deactivate previously active element
        self.deactivate();
        
        // Make editable
        $(el).attr('contenteditable', true);
        activeElement = el;
        
        // Show and reposition controls
        $controls.show();
        var offset = $(el).offset();
        $controls.css('left', offset.left)
                 .css('top', offset.top-$controls.height()-10);
      }
    }
    
    $controls = $(controlsTpl),                // the controls panel
    $controls.prependTo($('body')).hide();
    
    // Bind events for controls
    $('.proper-commands a.command').click(function(e) {
      commands['exec'+ $(e.currentTarget).attr('command').toUpperCase()]();
      self.trigger('changed');
      return false;
    });
    

    // Expose public API
    // -----------
    
    
    // Mixin Events module
    _.extend(self, _.Events);
    return self;
  };
  
})();