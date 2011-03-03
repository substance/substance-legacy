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
      <a href="#" title="Bullet List" class="command ul" command="ul"><div>Bullets List</div></a>\
      <a href="#" title="Numbered List" class="command ol" command="ol"><div>Numbered List</div></a>\
      <a href="#" title="Indent" class="command indent" command="indent"><div>Indent</div></a>\
      <a href="#" title="Outdent" class="command outdent" command="outdent"><div>Outdent</div></a>\
      <a title="Link" href="#" class="command link" command="link"><div>Link</div></a>\
      <br class="clear"/>\
    </div>';
  
  var COMMANDS = {
    "em": "italic",
    "strong": "bold",
    "ul": "insertUnorderedList",
    "ol": "insertOrderedList",
    "indent": "indent",
    "outdent": "outdent",
    "link": "createLink"
  }
  
  // Proper
  // -----------
  
  this.Proper = function(options) {
    var activeElement = null, // element that's being edited
        $controls,
        self = {},
        that = this,
        pendingChange = false,
        options = {},
        defaultOptions = { // default options
          multiline: true,
          markup: true
        };
    
    // Setup temporary hidden DOM Node, for sanitization
    $('body').append($('<div id="proper_content"></div>').hide());
    var rawContent = $('<div id="proper_raw_content" contenteditable="true"></div>');
    rawContent.css('position', 'fixed');
    rawContent.css('top', '20px');
    rawContent.css('left', '20px');
    rawContent.css('opacity', '0');
    
    $('body').append(rawContent);
    
    // Commands
    // -----------
    
    function tagActive(element) {
      var sel = window.getSelection();
      var range = sel.getRangeAt(0);
      return range.startContainer.parentNode.localName === element || range.endContainer.parentNode.localName === element;
    }
    
    // A proper implementation of execCommand
    function toggleTag(tag) {
      var sel = window.getSelection();
      var range = sel.getRangeAt(0);
      
      if (sel+"".length == 0) return;
      
      if (tagActive(tag)) {
        document.execCommand('removeFormat');
      } else {
        var sel = window.getSelection();
        var range = sel.getRangeAt(0);
        document.execCommand('removeFormat');
        document.execCommand('insertHTML', false, '<'+tag+'>'+window.getSelection()+'</'+tag+'>');
      }
    }
    
    var commands = {
      execEM: function() {
        if (!document.queryCommandState('italic')) document.execCommand('removeFormat');
        document.execCommand('italic', false, true);
        return false;
      },

      execSTRONG: function() {
        if (!document.queryCommandState('bold')) document.execCommand('removeFormat');
        document.execCommand('bold', true, true);
        return false;
      },
      
      execCODE: function() {
        if (!tagActive('code')) document.execCommand('removeFormat');
        toggleTag('code');
        return false;
      },

      execUL: function() {
        document.execCommand('insertUnorderedList', true, null);
        return false;
      },

      execOL: function() {
        document.execCommand('insertOrderedList', true, null);
        return false;
      },

      execINDENT: function() {
        if (document.queryCommandState('insertOrderedList') || document.queryCommandState('insertUnorderedList')) {
          document.execCommand('indent', false, null);
        }
        return false;
      },

      execOUTDENT: function() {
        if (document.queryCommandState('insertOrderedList') || document.queryCommandState('insertUnorderedList')) {
          document.execCommand('outdent', false, null);
        }
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
    
    function sanitize() {
      var rawContent = document.getElementById('proper_raw_content');
      if (options.markup) {
        var s = new Sanitize(Sanitize.Config.BASIC);
        var content = s.clean_node(rawContent);
        $('#proper_content').html(content);
      } else {
        $('#proper_content').html($(rawContent).text());
      }
    }
    
    function updateCommandState() {
      if (!options.markup) return;
      $(activeElement).focus();
      
      $controls.find('.command').removeClass('selected');
      _.each(COMMANDS, function(command, key) {
        if (document.queryCommandState(command)) {
          $controls.find('.command.'+key).addClass('selected');
        }
        if (tagActive('code')) {
          $controls.find('.command.code').addClass('selected');
        }
      });
    }
    
    // Used for placeholders
    function checkEmpty() {
      if ($(activeElement).text().trim().length === 0) {
        $(activeElement).addClass('empty');
        if (options.markup) {
          $(activeElement).html('<p>&laquo; '+options.placeholder+' &raquo;</p>');
        } else {
          $(activeElement).html('&laquo; '+options.placeholder+' &raquo;');
        }
      }
    }
    
    // Clean up the mess produced by contenteditable
    function semantify(html) {
      return html.replace(/<i>/g, '<em>')
                 .replace(/<\/i>/g, '</em>')
                 .replace(/<b>/g, '<strong>')
                 .replace(/<\/b>/g, '</strong>');
    }
    
    function saveSelection() {
      if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
          return sel.getRangeAt(0);
        }
      } else if (document.selection && document.selection.createRange) {
        return document.selection.createRange();
      }
      return null;
    }

    function restoreSelection(range) {
      if (range) {
        if (window.getSelection) {
          sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (document.selection && range.select) {
          range.select();
        }
      }
    }
    
    function selectAll() {
      range = document.createRange();
      range.selectNodeContents($(activeElement)[0]);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    function bindEvents(el) {
      $(el).unbind('paste');
      $(el).unbind('keydown');
      $(el).unbind('keyup');
      $(el).unbind('blur');
      $(el).bind('paste', function() {
        var selection = saveSelection();
        $('#proper_raw_content').focus();
        
        // Immediately sanitize pasted content
        setTimeout(function() {
          sanitize();
          restoreSelection(selection);
            $(el).focus();
            document.execCommand('insertHTML', false, $('#proper_content').html().trim());
            $('#proper_raw_content').html('');
        }, 1);
      });
      
      // Prevent multiline
      $(el).bind('keydown', function(e) {
        if (!options.multiline && e.keyCode === 13) {
          e.stopPropagation();
          return false;
        }
        
        if (e.keyCode == 8 && $(activeElement).text().trim().length == 0) {
          e.stopPropagation();
          return false;
        }
      });
      
      $(el).bind('blur', checkEmpty);
      
      $(el).bind('keyup', function(e) {        
        updateCommandState();
        
        if ($(activeElement).text().trim().length > 0) {
          $(activeElement).removeClass('empty');
        } else {
          // Todo: problematic when hitting enter on an empty div
          selectAll();
          document.execCommand('insertHTML', false, "");
          $(activeElement).addClass('empty');
        }
        
        // Trigger change events, but consolidate them to 200ms time slices
        setTimeout(function() {
          // Skip if there's already a change pending
          if (!pendingChange) {
            pendingChange = true;
            setTimeout(function() {
              pendingChange = false;
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
      // $(activeElement).attr('contenteditable', 'false');
      $(activeElement).unbind('paste');
      // $(activeElement).unbind();
      $('.proper-commands').remove();
      self.unbind('changed');
    };
    
    // Activate editor for a given element
    self.activate = function(el, opts) {
      options = {};
      _.extend(options, defaultOptions, opts);
      
      // Deactivate previously active element
      self.deactivate();
      
      // Make editable
      $(el).attr('contenteditable', true);
      activeElement = el;
      bindEvents(el);
      
      // Setup controls
      if (options.markup) {
        $controls = $(controlsTpl); 
        $controls.appendTo($(options.controlsTarget));          
      }
      
      updateCommandState();
      if (el.hasClass('empty')) {
        selectAll();
        document.execCommand('insertHTML', false, "");
      }
      
      $('.proper-commands a.command').click(function(e) {
        commands['exec'+ $(e.currentTarget).attr('command').toUpperCase()]();
        updateCommandState();
        setTimeout(function() {
          self.trigger('changed');
        }, 10);
        return false;
      });
    };
    
    // Get current content
    self.content = function() {
      if ($(activeElement).hasClass('empty')) return '';
      
      if (options.markup) {
        return activeElement ? semantify($(activeElement).html()).trim() : '';
      } else {
        return $(activeElement).text().trim();
      }
    };
    
    // Expose public API
    // -----------
    
    _.extend(self, _.Events);
    return self;
  };
})();