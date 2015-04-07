'use strict';

var Substance = require('../basics');
var Document = require('../document');

//  Helper to map selection between model and DOM
function DomSelection(rootElement) {
  this.rootElement = rootElement;

  this.nativeSelection = null;
  this.modelSelection = null;
  this.nativeRanges = [];
}

DomSelection.Prototype = function() {

  var findPosition = function(element, offset) {
    var text = $(element).text();

    // not in this element
    if (text.length < offset) {

      return {
        node: null,
        offset: offset - text.length
      };
    // at the right boundary
    } else if (element.nodeType === document.TEXT_NODE) {
      return {
        node: element,
        offset: offset,
        boundary: (text.length === offset)
      };
    // within the node or a child node
    } else {
      for (var child = element.firstChild; child; child = child.nextSibling) {
        var pos = findPosition(child, offset);
        if (pos.node) {
          return pos;
        } else {
          // not found in this child; then pos.offset contains the translated offset
          offset = pos.offset;
        }
      }
      throw new Error("Illegal state: we should not have reached here!");
    }
  };

  var getPathFromElement = function(el) {
    var path = [];
    var elements = [];
    var current = el;
    while(current) {
      var $current = $(current);
      // if available extract a path fragment
      var pathProperty = $current.attr("data-path");
      if (pathProperty) {
        path = pathProperty.split('.');
        return {
          path: path,
          element: current
        };
      }
      // if there is a path attibute we collect it
      var propName = $current.attr("data-property");
      if (propName) {
        path.unshift(propName);
        elements.unshift(current);
      }
      var nodeId = $current.attr("data-node-id");
      if (nodeId) {
        path.unshift(nodeId);
        elements.unshift(current);
        // STOP here
        return { path: path, element: elements[elements.length-1] };
      }
      current = $current.parent()[0];
    }
    return null;
  };

  var modelCoordinateFromDomPosition = function(domNode, offset, options) {
    options = options || {};
    var found = getPathFromElement(domNode);
    if (!found) return null;
    var path = found.path;
    var element = found.element;
    var charPos = 0;
    // TODO: in future we might support other component types than string
    var range = window.document.createRange();
    range.setStart(element, 0);
    range.setEnd(domNode, offset);
    charPos = range.toString().length;
    // TODO: this needs more experiments, at the moment we do not detect these cases correctly
    var after = (options.left && offset === domNode.length) || (options.right && offset == 0) ;
    return {
      domNode: element,
      coordinate: new Document.Coordinate(path, charPos, after)
    };
  };

  var modelCoordinateToDomPosition = function(rootElement, coordinate) {
    var componentElement = DomSelection.getDomNodeForPath(rootElement, coordinate.path);
    if (componentElement) {
      return findPosition(componentElement, coordinate.offset);
    }
  };

  var selection_equals = function(s1, s2) {
    return (s1.anchorNode === s2.anchorNode && s1.anchorOffset === s2.anchorOffset &&
        s1.focusNode === s2.focusNode && s1.focusOffset === s2.focusOffset);
  };

  var selection_clone = function(s) {
    return {
      anchorNode: s.anchorNode,
      anchorOffset: s.anchorOffset,
      focusNode: s.focusNode,
      focusOffset: s.focusOffset
    };
  };

  this.get = function(options) {
    var sel = window.getSelection();
    if (this.nativeSelection && selection_equals(sel, this.nativeSelection)) {
      return this.modelSelection;
    }

    this.nativeSelection = selection_clone(sel);
    this.nativeRanges = [];

    var isReverse = false;
    if (sel.focusNode && sel.anchorNode) {
      var cmp = sel.focusNode.compareDocumentPosition(sel.anchorNode);
      isReverse = (
        ( (cmp & (window.document.DOCUMENT_POSITION_FOLLOWING) ) > 0 ) ||
        (cmp === 0 && sel.focusOffset < sel.anchorOffset)
      );
    }
    // console.log('####', isReverse, cmp);
    var rangeCount = sel.rangeCount;
    var ranges = [];
    var result, range;
    if (rangeCount === 0) {
      result = Document.NullSelection;
    } else {
      for (var i = 0; i < rangeCount; i++) {
        range = sel.getRangeAt(i);
        var start = modelCoordinateFromDomPosition(range.startContainer, range.startOffset, options);
        var end = start;
        if (range.collapsed) {
          end = start;
        } else {
          end = modelCoordinateFromDomPosition(range.endContainer, range.endOffset, options);
        }
        if (start && end) {
          ranges.push(new Document.Range(start.coordinate, end.coordinate));
          this.nativeRanges.push({
            start: start.domNode,
            end: end.domNode
          });
        }
      }
      if (ranges.length > 1) {
        console.log("Multi-Selections are not supported yet");
        result = Document.NullSelection;
      } else if (ranges.length === 1) {
        range = ranges[0];
        if (Substance.isArrayEqual(range.start.path, range.end.path)) {
          result = new Document.PropertySelection(range, isReverse);
        } else {
          // TODO: where to get the container from?
          var container = null;
          result = new Document.ContainerSelection(container, range, isReverse);
        }
      } else {
        result = Document.NullSelection;
      }
    }
    this.modelSelection = result;
    return result;
  };

  this.set = function(modelSelection) {
    var sel = window.getSelection();
    if (modelSelection.isNull()) {
      sel.removeAllRanges();
      return;
    }
    var ranges = modelSelection.getRanges();
    var domRanges = [];
    var i, range;
    for (i = 0; i < ranges.length; i++) {
      range = ranges[i];
      var startPosition = modelCoordinateToDomPosition(this.rootElement, range.start);
      if (!startPosition) {
        // Not within this surface. Maybe it was in a different surface
        continue;
      }
      var endPosition;
      if (range.isCollapsed()) {
        endPosition = startPosition;
      } else {
        endPosition = modelCoordinateToDomPosition(this.rootElement, range.end);
      }
      domRanges.push({ start: startPosition, end: endPosition });
    }
    // just do nothing if there is no mapping
    if (domRanges.length === 0) {
      return;
    }
    // if there is a range then set replace the window selection accordingly
    sel.removeAllRanges();
    for (i = 0; i < domRanges.length; i++) {
      var domRange = domRanges[i];
      range = window.document.createRange();
      range.setStart(domRange.start.node, domRange.start.offset);
      range.setEnd(domRange.end.node, domRange.end.offset);
      sel.addRange(range);
    }
  };

};

Substance.initClass(DomSelection);

DomSelection.getDomNodeForPath = function(rootElement, path) {
  var componentElement = rootElement.querySelector('*[data-path="'+path.join('.')+'"]');
  if (!componentElement) {
    console.error('Could not find DOM element for path', path);
    return null;
  }
  return componentElement;
};

module.exports = DomSelection;
