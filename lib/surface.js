//     (c) 2012 Victor Saiz, Michael Aufreiter
//     Surface is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/surface/surface

(function (w) {

  // Backbone.Events
  // -----------------

  // Regular expression used to split event strings
  var eventSplitter = /\s+/;
  // Create a local reference to slice/splice.
  var slice = Array.prototype.slice;
  var splice = Array.prototype.splice;

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback functions
  // to an event; trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
    _.Events = w.Backbone ? Backbone.Events : {

    // Bind one or more space separated events, `events`, to a `callback`
    // function. Passing `"all"` will bind the callback to all events fired.
    on: function (events, callback, context) {

      var calls, event, node, tail, list;
      if (!callback) return this;
      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      // Create an immutable callback list, allowing traversal during
      // modification.  The tail is an empty object that will always be used
      // as the next node.
      while (event = events.shift()) {
        list = calls[event];
        node = list ? list.tail : {};
        node.next = tail = {};
        node.context = context;
        node.callback = callback;
        calls[event] = {tail: tail, next: list ? list.next : node};
      }

      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all callbacks
    // with that function. If `callback` is null, removes all callbacks for the
    // event. If `events` is null, removes all bound callbacks for all events.
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) return;
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      // Loop through the listed events and contexts, splicing them out of the
      // linked list of callbacks if appropriate.
      events = events ? events.split(eventSplitter) : _.keys(calls);
      while (event = events.shift()) {
        node = calls[event];
        delete calls[event];
        if (!node || !(callback || context)) continue;
        // Create a new list, omitting the indicated callbacks.
        tail = node.tail;
        while ((node = node.next) !== tail) {
          cb = node.callback;
          ctx = node.context;
          if ((callback && cb !== callback) || (context && ctx !== context)) {
            this.on(event, cb, ctx);
          }
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) return this;
      all = calls.all;
      events = events.split(eventSplitter);
      rest = slice.call(arguments, 1);

      // For each event, walk through the linked list of callbacks twice,
      // first to trigger the event, then to trigger any `"all"` callbacks.
      while (event = events.shift()) {
        if (node = calls[event]) {
          tail = node.tail;
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, rest);
          }
        }
        if (node = all) {
          tail = node.tail;
          args = [event].concat(rest);
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, args);
          }
        }
      }

      return this;
    }

  };

  // Substance
  // ---------
  if (!w.Substance || !Substance) { w.Substance = Substance = {}; }



  // Surface
  // ---------

  // TODO: revise all the string search releted scripts
  // ..... and see if we acn do a better using rangy's
  // ..... functionality

  Substance.Surface = function(options) {

    var $el = $(options.el)
    ,   selectionIsValid = false
    ,   annotations = options.annotations
    ,   prevText = options.content
    ,   events = _.extend({}, _.Events);

    // Inject content
    $el.html(options.content);

    // Fire off rangy
    rangy.init();

    // Returns the absolute offset from the top of the container
    function getCharacterOffsetWithin(sel, node) {

      var range = sel.getRangeAt(0)
      ,   lefOffset = 0
      ,   begining = 0
      ,   end = 0
      ,   prev = range.startContainer

      ,   treeWalker = document.createTreeWalker( node, NodeFilter.SHOW_TEXT, function(node) {
            var filter = NodeFilter.FILTER_REJECT
            ,   nodeRange = rangy.createRange();

            nodeRange.selectNodeContents(node);

            if( nodeRange.compareBoundaryPoints( Range.END_TO_END, range ) === -1 ){
              filter = NodeFilter.FILTER_ACCEPT;
            }

            return filter;
            },
          false );

      // Let's calculate the offset 
      while (treeWalker.nextNode()) {
        lefOffset += treeWalker.currentNode.length;
      }
      // and add the accumulated offset to the range
      if (prev.nodeType == 3) {
        begining += lefOffset + range.startOffset;
        end += lefOffset + range.endOffset;
      }

      // string index fallback for when miss-matched selections occur
      var selStr = sel.toString();
      var selStrLen = selStr.length;
      
      // We have a miss-matched selection here!
      if(range.endOffset - range.startOffset !== selStrLen){
        // we rely on the string search results then 
        // which works great if selection is longer than 3 characters ;) !
        var content = getText();
      
        var begining = content.indexOf(selStr);
        var end = begining + selStrLen;
      }

      return {'beg':begining, 'end':end};
    }

    // Returns all the matcing annotations within the current selection
    function matchingAnnotations(){
      var sel = rangy.getSelection();
      var pos = getCharacterOffsetWithin(sel, $el[0]);
      var matched = _.filter(annotations, function(ann){ return ann.beg >= pos.beg && ann.end <= pos.end; });
      return matched;
    }

    // Returns if the current position/selection is within an existing annotation !!! only exact match
    function doesMatch(){
      var sel = rangy.getSelection();
      var pos = getCharacterOffsetWithin(sel, $el[0]);
      
      var matched = _.find(annotations, function(ann){ return ann.beg === pos.beg && ann.end === pos.end; });
      return matched !== undefined ? matched : false ;
    }

    // returns a selection array
    function selection(){
      var sel = rangy.getSelection();
      var pos = getCharacterOffsetWithin(sel, $el[0]);

      return [pos.beg, pos.end];
    }

    // retrieves the plain text contained in our surface
    function getText(){
      return $el.text();
    }

    function setText(text) {
      if (prevText !== text) {
        events.trigger('text:change', text, prevText);
        prevText = text;
      }
    }

    // removes passed in annotation
    function removeAnnotation(annot){
      annotations = _.without(annotations, annot);
    }

    // Modify the selection programmatically
    function select(beg, end){
      var range = rangy.createRange()
      ,   el = $el.contents(0)[0]
      ,   off = 0;

      // To select aftet some annotations happened:
      if(annotations.length > 0){
        // first find out what we are trying to select in a clean scenario
        // then iterate trough the nodes looking for that value
        // after we find it based on the relative offsetted within that node
        // apply that selection
        var buffSize = 5 // we grab some extra text to make the search more specific
        ,   txt = getText()
        ,   findStart = txt.charAt(beg - buffSize)
        ,   findText = ''
        ,   i = beg - buffSize;

        for (; i < end; i++) {
          findText += txt.charAt(i);
        }
        var walker = document.createTreeWalker( $el[0], NodeFilter.SHOW_TEXT, function(node){
          // TODO: should implement a similar function to what we use for applying here
          // ..... also probably it's better to leverage rangy's functions to accomplish this
          // ..... in both parts
          return true;
        }, false );
        while (walker.nextNode()) {
          var found = walker.currentNode.nodeValue.indexOf(findText);
          if(found > 0){
            found = found + buffSize;
            end = found + (end - beg);
            beg = found;
            el = walker.currentNode;
          }
        }
      }

      range.setStart(el, beg);
      range.setEnd(el, end);
      rangy.getSelection().setSingleRange(range);
    }

    // Applies the operations
    function apply(operation){

      var op = operation[0]
      ,   prop = operation[1]
      ,   type = prop.type.data || prop.type
      ,   attr = prop.attributes || {}
      ,   operation = [op]
      ,   id = _.uniqueId('annotation:')
      ,   opAttr = {'id' : id, 'type': type};

      // Types of Operations
      switch (op){

        case 'insert':

          var sel = rangy.getSelection()
          ,   options = {ignoreWhiteSpace: true}
          ,   annt = {'id' : id}
          ,   pos = getCharacterOffsetWithin(sel, $el[0]);

          // Types of annotations
          switch (type) {

            // Inserting a link annotation
            case 'link':

              var prmpt = attr.prompt || "Add a valid URL"
              ,   href = attr.href || "#"
              ,   placeholder = attr.placeholder || "http://"
              ,   url = prompt(prmpt, placeholder);

              options.elementTagName = "a";
              options.elementProperties = {
                href: href,
                onclick: function() { 
                  window.location.href = url;
                  return false;
                }
              };

              opAttr.properties = {"url": url};
              annt.url = url;
              break;

            // Inserting a link annotation
            case 'comment':
              var prmpt = attr.prompt || "Your comment"
              ,   placeholder = attr.placeholder || ""
              ,   comment = prompt(prmpt, placeholder);

              opAttr.properties = {"content": comment};
              annt.comment = comment;
              break;

            // Inserting generic annotation
            default:
              break;
          }

          annCss = rangy.createCssClassApplier(type, options);
          var existing = doesMatch();
          if(existing){
            // we must remove the annotation too here
            annCss.undoToSelection();
            removeAnnotation(existing);
          }else{
            // We only anotate when there's at least one character selected
            if(selectionIsValid){
              // and when we have more tha one character selected         
              annCss.applyToSelection();
              annt.beg = pos.beg;
              annt.end = pos.end;
              annt.type = type;
              annt.data = sel.toString();

              annotations.push(annt);
              console.log(annt);
              opAttr.pos = [pos.beg, pos.end];

              operation.push(opAttr);
              events.trigger('annotation:change', operation);
            }
          }

          break;
      }
    }

    // Events
    // ------

    $el.on('mouseup', function(){
      var sel = rangy.getSelection();

      if(sel.toString().length > 0){
        selectionIsValid = true;
        events.trigger('selection:change', matchingAnnotations());
      }else{
        selectionIsValid = false;
      }
    });

    $($el).focus(function() {
      events.trigger('surface:active');
    });

    $($el).click(function() {
      return false;
    });

    $($el).blur(function() {
      var newText = getText();
      if (prevText !== newText) {
        events.trigger('text:change', newText, prevText);
        prevText = newText;
      }
    });

    // Exposed API
    // -----------------
    
    return {
      on:          function () { events.on.apply(events, arguments); },
      off:         function () { events.off.apply(events, arguments); },
      trigger:     function () { events.trigger.apply(events, arguments); },

      apply:        apply,
      selection:    selection,
      getText:      getText,
      setText:      setText,
      select:       select
    };

  }
})(window);