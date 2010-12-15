//     (c) 2010 Michael Aufreiter
//     Proper is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/michael/proper

(function(){
  
  // _.Events (borrowed from Backbone.js)
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
  
  _.Events = window.Backbone ? Backbone.Events : {

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

  Sanitize.Config = {}
  Sanitize.Config.BASIC = {
    elements: [
       'a', 'b', 'br', 'em', 'i', 'li', 'ol', 'p', 'strong', 'code', 'ul'],

     attributes: {
       'a': ['href'],
     },

     protocols: {
       'a': {'href': ['ftp', 'http', 'https', 'mailto', Sanitize.RELATIVE]}
     }
  };


  // Initial Setup
  // -------------

  controlsTpl = ' \
    <div class="proper-commands"> \
      <a href="#" title="Emphasis" class="command em" command="em"><div>Emphasis</div></a> \
      <a href="#" title="Strong" class="command strong" command="strong"><div>Strong</div></a> \
      <a href="#" title="Code" class="command code" command="code"><div>Code</div></a> \
      <div class="separator">|</div> \
      <a href="#" title="Bullet List" class="command ul" command="ul"><div>Bullets List</div></a> \
      <a href="#" title="Numbered List" class="command ol" command="ol"><div>Numbered List</div></a> \
      <a href="#" title="Indent" class="command indent" command="indent"><div>Indent</div></a> \
      <a href="#" title="Outdent" class="command outdent" command="outdent"><div>Outdent</div></a> \
      <div class="separator">|</div> \
      <a title="List" href="#" class="command link" command="link"><div>Link</div></a> \
      <br class="clear"/> \
    </div> \
  ';
  
  // Proper
  // -----------
  
  this.Proper = function(options) {
    var activeElement = null,     // element that is being edited
        $controls,
        self = {},
        that = this,
        pendingChange = false;
    
    // Setup temporary hidden DOM Node, for sanitization
    $('body').append($('<div id="proper_content"></div>').hide());
    
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
      
      execCODE: function() {
        document.execCommand('insertHTML', false, '<code>'+window.getSelection()+'</code>');
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
        document.execCommand('createLink', false, prompt('URL:'));
        return false;
      },

      showHTML: function() {
        alert($(this.el).html());
      }
    };
    
    // Clean up the mess produced by contenteditable
    function sanitize(element) {
      var s = new Sanitize(Sanitize.Config.BASIC);
      var content = s.clean_node(element);
      $('#proper_content').html(content);
    }
    
    function semantify(element) {
      $(element).find('b').each(function() {
        $(this).replaceWith($('<strong>').html($(this).html()));
      });
      
      $(element).find('i').each(function() {
        $(this).replaceWith($('<em>').html($(this).html()));
      });
    }
    
    function bindEvents(el) {
      $(el).bind('paste', function() {
        // Immediately sanitize pasted content
        setTimeout(function() {
          sanitize($(el)[0]);
          $(el).html($('#proper_content').html());
        }, 10);
      });
      
      $(el).bind('keyup', function() {
        // Trigger change events, but consolidate them to 200ms time slices
        setTimeout(function() {
          // Skip if there's already a change pending
          if (!pendingChange) {
            pendingChange = true;
            setTimeout(function() {
              pendingChange = false;
              
              // Sanitize on every keystroke
              sanitize($(activeElement)[0]);
              semantify($('#proper_content')[0]);
              
              self.trigger('changed');
            }, 200);
          }
        }, 10);
        
        return true;
      });
    }
    
    // Instance methods
    // -----------

    self.deactivate = function() {
      $(activeElement).attr('contenteditable', 'false');
      $(activeElement).unbind('paste');
      $controls.hide();
      self.unbind('changed');
    };
    
    // Activate editor for a given element
    self.activate = function(el) {
      
      if (el !== activeElement) {
        // Deactivate previously active element
        self.deactivate();
        
        // Make editable
        $(el).attr('contenteditable', true);
        activeElement = el;
        bindEvents(el);
        
        // Show and reposition controls
        
        // Init sanitized content
        $('#proper_content').html($(el).html());
        
        $controls.insertBefore(el);
        $controls.show();
      }
    };
    
    // Get current content
    self.content = function() {
      return activeElement ? $('#proper_content').html() : '';
    };
    
    $controls = $(controlsTpl); // the controls panel
    $controls.prependTo($('body')).hide();
    
    // Bind events for controls
    $controls.find('.proper-commands a.command').click(function(e) {
      commands['exec'+ $(e.currentTarget).attr('command').toUpperCase()]();
      setTimeout(function() {
        sanitize($(activeElement)[0]);
        semantify($('#proper_content')[0]);
        self.trigger('changed');
      }, 10);
      
      return false;
    });
    

    // Expose public API
    // -----------
    
    _.extend(self, _.Events);
    return self;
  };
  
})();