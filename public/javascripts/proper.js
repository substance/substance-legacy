//     (c) 2011 Michael Aufreiter
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
  
  _.stripTags = function(input, allowed) {
  // Strips HTML and PHP tags from a string
  //
  // version: 1009.2513
  // discuss at: http://phpjs.org/functions/strip_tags
     allowed = (((allowed || "") + "")
        .toLowerCase()
        .match(/<[a-z][a-z0-9]*>/g) || [])
        .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
     var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
         commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
     return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1){
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
     });
  };

  // Initial Setup
  // -------------

  controlsTpl = ' \
    <div class="proper-commands"> \
      <a href="#" title="Emphasis (CTRL+SHIFT+E)" class="command em" command="em"><div>Emphasis</div></a> \
      <a href="#" title="Strong (CTRL+SHIFT+S)" class="command strong" command="strong"><div>Strong</div></a> \
      <a href="#" title="Inline Code (CTRL+SHIFT+C)" class="command code" command="code"><div>Code</div></a> \
      <a title="Link (CTRL+SHIFT+L)" href="#" class="command link" command="link"><div>Link</div></a>\
      <a href="#" title="Bullet List (CTRL+SHIFT+B)" class="command ul" command="ul"><div>Bullets List</div></a>\
      <a href="#" title="Numbered List (CTRL+SHIFT+N)" class="command ol" command="ol"><div>Numbered List</div></a>\
      <a href="#" title="Indent (TAB)" class="command indent" command="indent"><div>Indent</div></a>\
      <a href="#" title="Outdent (SHIFT+TAB)" class="command outdent" command="outdent"><div>Outdent</div></a>\
      <br class="clear"/>\
    </div>';
  
  var COMMANDS = {
    "em": "italic",
    "strong": "bold",
    "ul": "insertUnorderedList",
    "ol": "insertOrderedList"
    // "link": "createLink" // for some reason Firefox can't work with that
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
          markup: true,
          placeholder: 'Enter Text',
          codeFontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
        };
    
    // Setup temporary hidden DOM Node, for sanitization
    var properContent = $('<div id="proper_content"></div>')
      .hide()
      .appendTo(document.body);
    // TODO: michael, explain why these css properties are needed -- timjb
    var rawContent = $('<div id="proper_raw_content" contenteditable="true"></div>')
      .css({
        position: 'fixed',
        top: '20px',
        left: '20px',
        opacity: '0'
      })
      .appendTo(document.body);
    
    // Commands
    // --------
    
    var commands = {
      execEM: function() {
        if (!document.queryCommandState('italic', false, true)) document.execCommand('removeFormat', false, true);
        document.execCommand('italic', false, true);
      },

      execSTRONG: function() {
        if (!document.queryCommandState('bold', false, true)) document.execCommand('removeFormat', false, true);
        document.execCommand('bold', false, true);
      },
      
      execCODE: function() {
        document.execCommand('removeFormat', false, true);
        if (cmpFontFamily(document.queryCommandValue('fontName'), options.codeFontFamily)) {
          $(activeElement).find('.code-span').filter(function() {
            return !cmpFontFamily($(this).css('font-family'), options.codeFontFamily);
          }).remove();
        } else {
          document.execCommand('fontName', false, options.codeFontFamily);
          $(activeElement).find('font').addClass('proper-code');
          $(activeElement).find('span').filter(function() {
            return cmpFontFamily($(this).css('font-family'), options.codeFontFamily);
          }).addClass('proper-code');
        }
      },

      execUL: function() {
        document.execCommand('insertUnorderedList', false, true);
      },

      execOL: function() {
        document.execCommand('insertOrderedList', false, true);
      },

      execINDENT: function() {
        if (document.queryCommandState('insertOrderedList', false, true) || document.queryCommandState('insertUnorderedList', false, true)) {
          document.execCommand('indent', false, true);
        }
      },

      execOUTDENT: function() {
        if (document.queryCommandState('insertOrderedList', false, true) || document.queryCommandState('insertUnorderedList', false, true)) {
          document.execCommand('outdent', false, true);
        }
      },
      
      execLINK: function() {
        document.execCommand('createLink', false, window.prompt('URL:', 'http://'));
      },

      showHTML: function() {
        alert($(this.el).html());
      }
    };
    
    // TODO: enable proper sanitizing that allows markup to be pasted too
    function sanitize() {      
      properContent.html(rawContent.text());
    }
    
    function normalizeFontFamily(s) {
      return (''+s).replace(/\s*,\s*/g, ',').replace(/'/g, '"');
    }
    
    function cmpFontFamily(a, b) {
      a = normalizeFontFamily(a);
      b = normalizeFontFamily(b);
      if ($.browser.msie) {
        if (a.split(',').length === 1) {
          return b.split(',').indexOf(a) > -1;
        } else if (b.split(',').length === 1) {
          return a.split(',').indexOf(b) > -1;
        } else {
          return a === b;
        }
      } else {
        return a === b;
      }
    }
    
    function getCorrectTagName(node) {
      var tagName = node.nodeName.toLowerCase();
      
      if (tagName === 'i') return 'em';
      if (tagName === 'b') return 'strong';
      if (tagName === 'font') return 'code';
      if (tagName === 'span') {
        if (node.style.fontWeight === 'bold') return 'strong';
        if (node.style.fontStyle === 'italic') return 'em';
        if (cmpFontFamily(node.style.fontFamily, options.codeFontFamily)) return 'code';
      }
      return tagName;
    }
    
    function escape(text) {
      return text.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;');
    }
    
    function semantifyContents(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return escape(node.data);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        var tagName = getCorrectTagName(node);
        
        if (tagName === 'br') return '<br />';
        
        var result = tagName === 'a' ? '<a href="'+escape(node.href)+'">'
                                     : '<'+tagName+'>';
        var children = node.childNodes;
        for (var i = 0, l = children.length; i < l; i++) {
          result += semantifyContents(children[i]);
        }
        result += '</'+tagName+'>';
        return result;
      } else {
        return '';
      }
    }
    
    function updateCommandState() {
      if (!options.markup) return;
      
      $controls.find('.command').removeClass('selected');
      _.each(COMMANDS, function(command, key) {
        if (document.queryCommandState(command, false, true)) {
          $controls.find('.command.'+key).addClass('selected');
        }
        if (cmpFontFamily(document.queryCommandValue('fontName'), options.codeFontFamily)) {
          $controls.find('.command.code').addClass('selected');
        }
      });
    }
    
    function maybeInsertPlaceholder() {
      if ($(activeElement).text().trim().length === 0) {
        $(activeElement).addClass('empty');
        if (options.markup) {
          $(activeElement).html('<p>&laquo; '+options.placeholder+' &raquo;</p>');
        } else {
          $(activeElement).html('&laquo; '+options.placeholder+' &raquo;');
        }
      }
    }
    
    function maybeRemovePlaceholder() {
      if ($(activeElement).hasClass('empty')) {
        $(activeElement).removeClass('empty');
        selectAll();
        document.execCommand('delete', false, "");
      }
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
          var sel = window.getSelection();
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
      $(el)
        .unbind('paste')
        .unbind('keydown')
        .unbind('keyup')
        .unbind('focus')
        .unbind('blur');
      
      $(el).bind('paste', function() {
        var selection = saveSelection();
        rawContent.focus();
        
        // Immediately sanitize pasted content
        setTimeout(function() {
          sanitize();
          restoreSelection(selection);
          $(el).focus();
          
          // Avoid nested paragraph correction resulting from paste
          var content = properContent.html().trim();

          // For some reason last </p> gets injected anyway
          document.execCommand('insertHTML', false, content);
          rawContent.html('');
        }, 1);
      });
      
      // Prevent multiline
      $(el).bind('keydown', function(e) {
        if ((!options.multiline && e.keyCode === 13) ||
            (e.keyCode === 8 && $(activeElement).text().trim().length === 0)) {
          e.stopPropagation();
          e.preventDefault();
        }
      });
      
      $(el)
        .bind('focus', maybeRemovePlaceholder)
        .bind('blur', maybeInsertPlaceholder)
        .bind('click', updateCommandState);
      
      $(el).bind('keyup', function(e) {        
        updateCommandState();
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
      $(activeElement)
        .attr('contenteditable', 'false')
        .unbind('paste')
        .unbind('keydown');
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
      
      // Keyboard bindings
      if (options.markup) {
        function preventDefaultAnd(executeThisFunction) {
          return function (event) {
            event.preventDefault();
            executeThisFunction();
          };
        }
        $(activeElement)
          .keydown('ctrl+shift+e', preventDefaultAnd(commands.execEM))
          .keydown('ctrl+shift+s', preventDefaultAnd(commands.execSTRONG))
          .keydown('ctrl+shift+c', preventDefaultAnd(commands.execCODE))
          .keydown('ctrl+shift+l', preventDefaultAnd(commands.execLINK))
          .keydown('ctrl+shift+b', preventDefaultAnd(commands.execUL))
          .keydown('ctrl+shift+n', preventDefaultAnd(commands.execOL))
          .keydown('tab',          preventDefaultAnd(commands.execINDENT))
          .keydown('shift+tab',    preventDefaultAnd(commands.execOUTDENT));
      }
      
      $(activeElement).focus();
      updateCommandState();
      
      $('.proper-commands a.command').click(function(e) {
        e.preventDefault();
        commands['exec'+ $(e.currentTarget).attr('command').toUpperCase()]();
        $(activeElement).focus();
        updateCommandState();
        setTimeout(function() {
          self.trigger('changed');
        }, 10);
      });
    };
    
    // Get current content
    self.content = function() {
      if ($(activeElement).hasClass('empty')) return '';
      
      if (options.markup) {
        if (!activeElement) return '';
        
        var result = '';
        _.each($(activeElement).get(0).childNodes, function (child) {
          result += semantifyContents(child);
        })
        return result;
      } else {
        if (options.multiline) {
          return _.stripTags($(activeElement).html().replace(/<div>/g, '\n')
                                             .replace(/<\/div>/g, '')).trim();
        } else {
          return _.stripTags($(activeElement).html()).trim();
        }
      }
    };
    
    // Expose public API
    // -----------
    
    _.extend(self, _.Events);
    return self;
  };
})();
