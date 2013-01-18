//     (c) 2012 Victor Saiz, Michael Aufreiter

//     Surface is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/surface/surface

(function (w) {

  // Backbone.Events
  // -----------------

  var eventSplitter = /\s+/;
  var slice = Array.prototype.slice;
    _.Events = w.Backbone ? Backbone.Events : {
    on: function (events, callback, context) {
      var calls, event, node, tail, list;
      if (!callback) return this;
      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});
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
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;
      if (!(calls = this._callbacks)) return;
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }
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
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) return this;
      all = calls.all;
      events = events.split(eventSplitter);
      rest = slice.call(arguments, 1);
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

  Substance.Surface = function(options) {

    var el = options.el,
        selectionIsValid = false,
        annotations = options.annotations,
        types = options.types || {},
        active = false,
        pasting = false,
        clipboard = [],
        that = this;

    // Directly expose content, because it's a value not a reference
    this.content = options.content || '';
    this.prevContent = this.content;

    var dirtyNodes = {};


    function renderAnnotations() {
      removeClasses(el.childNodes);
      for (i in annotations) {
        var a = annotations[i];
        addClasses(elements(a.pos), a.type);
      };
    }

    // Initialize Surface
    // ---------------

    function init() {
      var br = '<br/>', innerHTML = '',
          span, i, len = that.content.length;
      
      for (i = 0; i < len; i++) {
        var ch = that.content[i];
        if (ch === "\n") {
          innerHTML += br;
        } else {
          var span = '<span>' + ch + '</span>';
          innerHTML += span;
        }
      };

      var newEl = el.cloneNode(false);
      newEl.innerHTML = innerHTML;
      el.parentNode.replaceChild(newEl, el);
      el = newEl;
      renderAnnotations();
    }

    // checks if the specified node contains a certain class
    function hasClass(ele, cls) {
      if(ele) return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
    }

    // adds specified css class to a specified node
    function addClass(ele, cls) {
      if (!hasClass(ele,cls)) ele.className += " "+cls;
      ele.className = cleanClasses(ele.className);
    }

    // removes a single class from a node
    function removeClass(ele, cls) {
      if (hasClass(ele,cls)) {
        var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
        ele.className = cleanClasses(ele.className.replace(reg,' '));
      }
    }
    
    // remove classes from list of nodes
    function removeClasses(elems, className) {
      var elem, i, l = elems.length;

      for ( i = 0; i < l; i++ ) {
        elem = elems[i];
        if ( elem.nodeType === 1 && elem.className ) { // speeds up quite much!
          if (className) {
            removeClass(elem,className);
          } else {
            elem.className = null;
          }
        }
      };

    }

    // cleans double spaces in classList
    function cleanClasses(classList) {
      classList = classList.replace(/\s{2,}/g, ' ').trim();
      //remove single white space; hoping no css classes of 1 char exists
      if(classList.length === 1) classList = null;
      return classList;
    }

    // add classes to a list of nodes
    function addClasses(elems, className) {
      var ln = elems.length, i;

      for (i = 0; i < ln; i++) {
        var elem = elems[i];
        if (elem.nodeType === 1) addClass(elem, className);
      };
    }

    // Highlight a particular annotation
    function highlight(id) {

      // Find and remove all higlighted chars
      var elems = el.getElementsByTagName('span');
      removeClasses(elems, 'highlight');

      // Mark the matching chars as highlited
      var a = annotationById(id);
      if (a) addClasses(elements(a.pos), 'highlight');
    }

    // Determines if a certain annotation is inclusive or not
    function isInclusive(a) {
      return (types[a.type]) ? types[a.type].inclusive : true;
    }

    // Set selection
    // ---------------

    function select(start, offset) {
      if (!active) return;

      var sel = window.getSelection(),
          range = document.createRange(),
          children = el.childNodes,
          numChild = children.length-1,
          isLastNode = start > numChild,
          startNode = isLastNode ? children[numChild] : children[start],
          endNode = offset ? children[(start + offset)] : startNode;

      if (children.length > 0) {
       // there is text in the container
        range.selectNode(startNode);
        // if its last node we set cursor after the char by collapsing end
        // else we set it before by collapsing to start
        range.collapse(!isLastNode); 
      } else {
        // No characters left in the container
        range.setStart(el, 0);
        range.setEnd(el, 0);
      }

      sel.removeAllRanges();
      sel.addRange(range);

      that.trigger('selection:changed', that.selection());
    }

    function insertAnnotation(a) {
      annotations[a.id] = a;
      dirtyNodes[a.id] = "insert";
      renderAnnotations();
      that.trigger('annotations:changed');
    }

    function updateAnnotation(options) {
      var id = options.id,
          annotation = annotationById(id);
      delete options.id;

      // Update properties
      _.extend(annotation, options);
      makeDirty(annotation);

      renderAnnotations();
      that.trigger('annotations:changed');
    }

    // Get current selection
    // ---------------

    function selection() {
      var sel = window.getSelection();
      if (sel.type === "None") return null;

      var range = sel.getRangeAt(0),
          length = range.cloneContents().childNodes.length,
          startContainer = range.startContainer,
          parent = startContainer.parentElement,
          indexOf = Array.prototype.indexOf,
          index = startContainer.nodeType === 3 ? indexOf.call(el.childNodes, parent) : 0;
      
      // There's an edge case at the very beginning
      if (range.startOffset !== 0) index += 1;
      if (range.startOffset > 1) index = range.startOffset;

      return [index, length];
    }

    // Matching annotations [xxxx.]
    // ---------------

    function getAnnotations(sel, aTypes) {
      if (sel) {
        var sStart = sel[0],
            sEnd   = sel[0] + sel[1];

        return _.filter(annotations, function(a) {
          var aStart = a.pos[0], aEnd = aStart + a.pos[1];
          
          if(types[a.type] && types[a.type].inclusive === false){
            // its a non inclusive annotation
            // so intersects doesnt include the prev and last chars
            var intersects = (aStart + 1) <= sEnd && (aEnd - 1) >= sStart;
          } else {
            var intersects = aStart <= sEnd && aEnd >= sStart;
          }
          // Intersects and satisfies type filter
          return intersects && (aTypes ? _.include(aTypes, a.type) : true);
        });
      } else {
        return annotations; // return all annotations
      }
    }

    function annotationById(id){
      return _.find(annotations, function(ann){ return ann.id == id; });
    }

    // Deletes passed in annotation
    // ---------------------------

    function deleteAnnotation(ann) {
      delete annotations[ann];
      // Flag as deleted so update events are sent appropriately
      dirtyNodes[ann] = "delete";
      that.trigger('annotations:changed');
      renderAnnotations();
    }

    function makeDirty(a) {
      if (dirtyNodes[a.id] === "insert") return; // new node -> leave untouched
      dirtyNodes[a.id] = "update";
    }

    // Transformers
    // ---------------

    function insertTransformer(index, offset) {
      // TODO: optimize
      _.each(annotations, function(a) {
        var aStart = a.pos[0],
            aEnd   = aStart + a.pos[1];

        if (aStart === index) {
        // Case1: insertion matching beginning
        // console.log('Case1: insertion matching beginning');

          if (isInclusive(a)) {
          // CaseA: inclusive
            makeDirty(a); // Mark annotation dirty
            a.isAffected = true;
            a.pos[1] += offset; // offseting tail 
            // console.log('inclusive, annotation is affected');
          } else {
            // if not including we have to push the begining
            // console.log('not including, we push the begining');
            a.pos[0] += offset;
            a.isAffected = false;
          }

        } else if (aStart < index && aEnd > index) {
        // Case2: insertion within annotation boundries
        // console.log('Case2: insertion within annotation boundries');
        // both inclusive and noninclusive react alike
        
        // marking dirty and offseting tail
        makeDirty(a);
        a.isAffected = true;
        a.pos[1] += offset;

      } else if (aEnd == index) {
        // Case3: insertion matching ending
        // console.log('Case3: insertion matching ending');

        if (isInclusive(a)) {
          // CaseA: inclusive
          // Only inclusive affects the annotation
          // console.log('CaseA: inclusive');
          makeDirty(a);
          a.isAffected = true;
          a.pos[1] += offset;
        } else {
          a.isAffected = false;
        }

      } else if (aStart > index) {
        // Case2: subsequent annotations -> Startpos needs to be pushed
        a.pos[0] += offset;
        makeDirty(a); // Mark annotation as dirty
        a.isAffected = true;
      }

      });
    }

    function deleteTransformer(index, offset) {
      // TODO: optimize
      _.each(annotations, function(a) {
        var aStart = a.pos[0],
            aEnd   = aStart + a.pos[1],
            sStart = index,
            sEnd   = index + offset;

        // Case1: Full overlap or wrap around overlap -> delete annotation
        if (sStart <= aStart && sEnd >= aEnd) {
          dirtyNodes[a.id] = "delete";

          // console.log('Case1:Full overlap', a.type + ' will be deleted');
          deleteAnnotation(a.id);
        }
        // Case2: inner overlap -> decrease offset length by the lenth of the selection
        else if (aStart < sStart && aEnd > sEnd) {
          // console.log(a);
          a.pos[1] = a.pos[1] - offset;
          makeDirty(a); // Mark annotation dirty
          // console.log('Case2:inner overlap', a.type + ' decrease offset length by ' + offset);
        }
        // Case3: before no overlap -> reposition all the following annotation indexes by the lenth of the selection
        else if (aStart > sStart && sEnd < aStart) {
          a.pos[0] -= offset;
          makeDirty(a); // Mark annotation dirty
          // console.log('Case3:before no overlap', a.type + ' index repositioned');
        }
        // Case4: partial rightside overlap -> decrease offset length by the lenth of the overlap
        else if (sStart <= aEnd && sEnd >= aEnd) {
          var delta = aEnd - sStart;
          a.pos[1] -= delta;
          makeDirty(a); // Mark annotation dirty
          // console.log('Case4:partial rightside overlap', a.type + ' decrease offset length by ' + delta);
        }
        // Case5: partial leftSide -> reposition index of the afected annotation to the begining of the selection
        // ...... and decrease the offset according to the length of the overlap
        else if (sStart <= aStart && sEnd >= aStart ) {
          var delta = sEnd - aStart;
          a.pos[0] = sStart;
          a.pos[1] -= delta;
          makeDirty(a); // Mark annotation dirty
          // console.log('Case5:partial leftSide',  a.type + 'reposition index and decrease the offset by ' + delta);
        }
      });
      renderAnnotations();
    }


    // State
    // ---------------

    function elements(range) {
      return slice.call(el.childNodes, range[0], range[0] + range[1]);
    }

    // Operations
    // ---------------

    function deleteRange(range) {
      if (range[0] < 0) return;
      var els = elements(range);
      for (var i = els.length - 1; i >= 0; i--) {
        el.removeChild(els[i]);
      };

      select(range[0]);
      deleteTransformer(range[0], range[1]);
      that.trigger('changed');
      that.trigger('selection:changed', that.selection());
      contentDeleteRange(range);
    }

    function contentDeleteRange(range) {
      if (range[0] < 0) return;
      that.content = that.content.substring(0, range[0]) + that.content.substring(range[0] + range[1]);
    }

    // Stateful
    function insertCharacter(ch, index) {
      var pureCh = ch, // we store the char for the content string;
          matched = getAnnotations([index,0]),
          classes = '',
          successor = el.childNodes[index],
          prev = el.childNodes[index-1],
          newEl = 'span',
          newCh;
      
      if (ch === " ") ch = "&nbsp;";
      if (ch === "\n") {
        newEl = 'br';
        if (!successor) classes += ' br';
      }

      // we perform the transformation before to see if the inclusive/noninclusive
      // affects in order to apply the class or not
      insertTransformer(index, 1);

      _.each(matched, function(a) {
        if (a.isAffected) classes += ' ' + a.type;
      });

      removeClass(prev, 'br');

      newCh = document.createElement(newEl);
      if(classes.length > 1) addClass(newCh, classes); // we still add class for the last br to display properly
      newCh.innerHTML = ch; // we still set innerHTML even if its a linebreak so its possible to select put the cursor after it 

      if (successor) {
        el.insertBefore(newCh, successor);
      } else {
        el.appendChild(newCh);
      }
      
      updateContent(pureCh, index);
      select(index+1);
      that.trigger('changed');
    }

    // Used for pasting content
    function insertText(text, index) {

      var successor = el.childNodes[index],
          els = text.split(''),
          span = document.createElement("span"),
          frag;

      for ( var e = 0; e < els.length; e++ ) {
        frag = span.cloneNode(false);
        frag.innerHTML = els[e];
        (successor) ? el.insertBefore( frag , successor) : el.appendChild( frag );
      }

      updateContent(text, index);
      insertTransformer(index, text.length);
      that.trigger('changed');
    }

    function updateContent(text, idx) {
      that.content = [that.content.slice(0, idx), text, that.content.slice(idx)].join('');
    }

    // Events
    // ------

    init();

    // Interceptors
    // -----------------
    // 
    // Overriding clumsy default behavior of contenteditable

    function handleKey(e) {
      if (e.data !== '\n'){
        var ch = e.data,
            range = selection(),// Is there an active selection?
            index = range[0] < 0 ? 0 : range[0],
            startContainer = window.getSelection().getRangeAt(0).startContainer;// look for ghost accents here
        
        if (startContainer.length > 1) {
          startContainer.textContent = startContainer.textContent[0]; // chop the ghost accent
          delete range[1]; //to avoid overriding inserting into next char
        }

        if (range[1]) deleteRange(range);
        insertCharacter(ch, index);
      }
      e.preventDefault();
      e.stopPropagation(); // needed?
    }

    function cancelSpace(e){
      if(e.keyCode === 32){
        // prevent default spacebar behavior
        e.preventDefault();
        // create our custom textEvent to trigger surface handelkey
        // REF: object.initTextEvent (eventName, bubbles, cancelable, view, data, inputMethod, locale);
        var evt = document.createEvent("TextEvent")
        evt.initTextEvent ("textInput", false, true, w, ' ');
        el.dispatchEvent(evt);
      }
    }

    // bypasses the default cut behaviour and passes it to
    // be pasted as plain text
    function handleCut(e) {
      var se = window.getSelection(),
          range = se.getRangeAt(0),
          elements = range.cloneContents().childNodes,
          len = elements.length,
          sel = selection();

      for (var i = 0; i < len; i++) {
        clipboard += elements[i].textContent;
      };
      sel[1]>0 ? deleteRange(sel) : deleteRange([sel[0], 1]);
      e.preventDefault();
    }

    function handlePaste(e) {
      var sel = selection();
      if(sel[1] > 0) deleteRange(sel);

      pasting = true;

      function getPastedContent (callback) {
        var tmpEl = el.cloneNode(false);
        tmpEl.className = 'clipboard';
        document.body.appendChild(tmpEl);
        if(clipboard.length > 1) {
          tmpEl.textContent = clipboard;
          clipboard = '';
        }
        tmpEl.focus();
        setTimeout(function () {
          document.body.removeChild(tmpEl);
          callback(tmpEl);
        }, 10);
      }

      getPastedContent(function (node) {
        var txt = node.textContent.trim();
        insertText(txt, sel[0]);
        select(sel[0]+txt.length);
        pasting = false;
      });
    }

    function handleBackspace(e) {
      if (active) {
        var sel = selection();
        sel[1]>0 ? deleteRange(sel) : deleteRange([sel[0]-1, 1]);
        
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function handleDel(e) {
      if (active) {
        var sel = selection();
        sel[1]>0 ? deleteRange(sel) : deleteRange([sel[0], 1]);
        
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function handleNewline(e) {
      if (!active) return;

      insertCharacter('\n', selection()[0]);
      e.preventDefault();
      e.stopPropagation();
    }

    function annotationUpdates() {
      var ops = [];
      var deletedAnnotations = [];

      _.each(dirtyNodes, function(method, key) {
        if (method === "delete") return deletedAnnotations.push(key);
        // var a = annotations[key];
        var a = annotationById(key);

        if (method === "insert") {
          ops.push(["insert", {id: a.id, type: a.type, pos: a.pos}]);
        } else if (method === "update") {
          ops.push(["update", {id: a.id, pos: a.pos}]);
        }
      });

      if (deletedAnnotations.length > 0) {
        ops.push(["delete", {"nodes": deletedAnnotations}]);
      }
      return ops;
    }

    function activateSurface(e) {
      if (pasting) return;
      active = true;
      addClass(this, 'active');
      renderAnnotations();
      that.trigger('surface:active', that.content, that.prevContent);
    }

    function deactivateSurface(e) {
      if (pasting) return;
      removeClass(this, 'active');
      highlight(null);
      commit(); // Commit changes
    }

    function selectionChanged() {
      if (!active) return;
      _.delay(function() {
        that.trigger('selection:changed', selection());
      }, 5);
    }

    // Programmatically commit changes
    function commit() {
      var ops = annotationUpdates();

      if (that.prevContent !== that.content || ops.length > 0) {
        dirtyNodes = {};
        that.trigger('content:changed', that.content, that.prevContent, ops);
        that.prevContent = that.content;
      }
      active = false;
    }
    

    // Bind Events
    // ------

    // Backspace key
    key('backspace', handleBackspace);
    key('del', handleDel);

    // Enter key for new lines
    key('shift+enter', handleNewline);
 
    // Cutting
    el.addEventListener('cut', handleCut);

    // Paste
    el.addEventListener('paste', handlePaste);

    // we cancel the spacebar scrolling here
    el.addEventListener('keydown', cancelSpace);

    // Inserting new characters
    el.addEventListener('textInput', handleKey);

    // Activate surface
    el.addEventListener('focus', activateSurface);

    // Deactivate surface
    el.addEventListener('blur', deactivateSurface);

    // Trigger selection changed event
    el.addEventListener('mouseup', selectionChanged);

    key('left, right, up, down', selectionChanged);
    key('shift+left, shift+right, shift+up, shift+down', selectionChanged);
    key('alt+left, alt+right, alt+up, alt+down', selectionChanged);
    key('⌘+left, ⌘+right, ⌘+up, ⌘+down', selectionChanged);
    key('alt+shift+left, alt+shift+right, alt+shift+up, alt+shift+down', selectionChanged);
    key('⌘+shift+left, ⌘+shift+right, ⌘+shift+up, ⌘+shift+down', selectionChanged);


    // Exposed API
    // -----------------

    this.select = select;
    this.selection = selection;
    this.commit = commit;
    this.annotations = annotations;
    this.deleteRange = deleteRange;
    this.insertCharacter = insertCharacter;
    this.insertText = insertText;
    this.insertAnnotation = insertAnnotation;
    this.updateAnnotation = updateAnnotation;
    this.getAnnotations = getAnnotations;
    this.deleteAnnotation = deleteAnnotation;
    this.highlight = highlight;
  };

  _.extend(Substance.Surface.prototype, _.Events);

})(window);