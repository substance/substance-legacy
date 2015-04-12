'use strict';

var Substance = require('../basics');
var Document = require('../document');

//  Helper to map selection between model and DOM
function DomSelection(rootElement, container) {
  this.rootElement = rootElement;
  this.nativeSelectionData = null;
  this.modelSelection = null;
  this.container = container;
}

var _findDomPosition = function(element, offset) {
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
  // HACK: for empty elements
  } else if (text.length === 0) {
    return {
      node: element,
      offset: offset,
      boundary: true
    };
  // within the node or a child node
  } else {
    for (var child = element.firstChild; child; child = child.nextSibling) {
      var pos = _findDomPosition(child, offset);
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

var _getPathFromElement = function(el) {
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
    var nodeId = $current.attr("data-id");
    if (nodeId) {
      // try to take the first property
      var $properties = $current.find('*[data-path]');
      if ($properties.length>0) {
        pathProperty = $($properties[0]).attr("data-path");
        path = pathProperty.split('.');
        return {
          path: path,
          element: $properties[0]
        };
      }
    }
    current = $current.parent()[0];
  }
  return null;
};

var _modelCoordinateFromDomPosition = function(domNode, offset, options) {
  options = options || {};
  var found = _getPathFromElement(domNode);
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
  var after = (options.left && offset === domNode.length) ||
    (options.right && offset === 0) ;
  return {
    domNode: element,
    coordinate: new Document.Coordinate(path, charPos, after)
  };
};

var _modelCoordinateToDomPosition = function(rootElement, coordinate) {
  var componentElement = DomSelection.getDomNodeForPath(rootElement, coordinate.path);
  if (componentElement) {
    var pos = _findDomPosition(componentElement, coordinate.offset);
    if (pos.node) {
      return pos;
    } else {
      return null;
    }
  }
};


DomSelection.Prototype = function() {

  var selectionEquals = function(s1, s2) {
    return (s1.anchorNode === s2.anchorNode && s1.anchorOffset === s2.anchorOffset &&
        s1.focusNode === s2.focusNode && s1.focusOffset === s2.focusOffset);
  };

  var selectionData = function(s) {
    var data = {
      anchorNode: s.anchorNode,
      anchorOffset: s.anchorOffset,
      focusNode: s.focusNode,
      focusOffset: s.focusOffset,
      range: null
    };
    if (s.rangeCount > 0) {
      data.range = s.getRangeAt(0);
    }
    return data;
  };

  this.get = function(options) {
    options = options || {};
    var sel = window.getSelection();
    if (this.nativeSelectionData && selectionEquals(sel, this.nativeSelectionData)) {
      return this.modelSelection;
    }
    var result;
    this.nativeSelectionData = selectionData(sel);
    var rangeCount = sel.rangeCount;
    if (rangeCount === 0) {
      result = Document.nullSelection;
    } else if (rangeCount > 1) {
      throw new Error('Multi-Selections not supported yet!');
    } else {
      options.container = this.container;
      result = DomSelection.getSelectionForDomSelection(sel, options);
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
      var startPosition = _modelCoordinateToDomPosition(this.rootElement, range.start);
      if (!startPosition) {
        // Not within this surface. Maybe it was in a different surface
        continue;
      }
      var endPosition;
      if (range.isCollapsed()) {
        endPosition = startPosition;
      } else {
        endPosition = _modelCoordinateToDomPosition(this.rootElement, range.end);
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

  this.clear = function() {
    var sel = window.getSelection();
    sel.removeAllRanges();
    this.nativeSelectionData = null;
  };

  this.isInside = function() {
    var sel = window.getSelection();
    if (sel.rangeCount === 0) {
      return false;
    }
    var range = sel.getRangeAt(0);
    // Note: Node.compareDocumentPosition has an inverse semantic
    // node1.compare(node2) === CONTAINS means 'node2 contains node1'
    var inside = (range.startContainer.compareDocumentPosition(this.rootElement)&window.Node.DOCUMENT_POSITION_CONTAINS);
    if (inside && !range.collapsed) {
      inside = (range.endContainer.compareDocumentPosition(this.rootElement)&window.Node.DOCUMENT_POSITION_CONTAINS);
    }
    return inside;
  };

};

Substance.initClass(DomSelection);

DomSelection.getDomNodeForPath = function(rootElement, path) {
  var componentElement = rootElement.querySelector('*[data-path="'+path.join('.')+'"]');
  if (!componentElement) {
    console.warn('Could not find DOM element for path', path);
    return null;
  }
  return componentElement;
};

DomSelection.findDomPosition = function(rootElement, path, offset) {
  var domNode = DomSelection.getDomNodeForPath(rootElement, path);
  if (domNode) {
    var pos = _findDomPosition(domNode, offset);
    if (pos.node) {
      return pos;
    } else {
      return null;
    }
  }
};

DomSelection.getSelectionForDomSelection = function(sel, options) {
  options = options || {};
  var anchorNode = sel.anchorNode;
  var anchorOffset = sel.anchorOffset;
  var focusNode = sel.focusNode;
  var focusOffset = sel.focusOffset;
  var wRange = sel.getRangeAt(0);
  var isCollapsed = sel.isCollapsed;
  var isReverse = false;
  if (!isCollapsed && focusNode && anchorNode) {
    var cmp = focusNode.compareDocumentPosition(anchorNode);
    isReverse = (
      ( (cmp & (window.document.DOCUMENT_POSITION_FOLLOWING) ) > 0 ) ||
      (cmp === 0 && focusOffset < anchorOffset)
    );
  }
  if (!focusNode || !anchorNode) {
    return Document.nullSelection;
  }
  return DomSelection.getSelectionForDomRange(wRange, isReverse, options);
};

DomSelection.getSelectionForDomRange = function(wRange, isReverse, options) {
  options = options || {};
  var start = _modelCoordinateFromDomPosition(wRange.startContainer, wRange.startOffset, options);
  var end;
  if (wRange.collapsed) {
    end = start;
  } else {
    end = _modelCoordinateFromDomPosition(wRange.endContainer, wRange.endOffset, options);
  }
  if (!start || !end) {
    return;
  }
  var range = new Document.Range(start.coordinate, end.coordinate);
  if (Substance.isArrayEqual(range.start.path, range.end.path)) {
    return new Document.PropertySelection(range, isReverse);
  } else {
    if (!options.container) {
      throw new Error('No container given, but selection is a container selection');
    }
    return new Document.ContainerSelection(options.container, range, isReverse);
  }
};

module.exports = DomSelection;
