var OO = require('../basics/oo');
var Document = require('../document');
var _ = require('../basics/helpers');
var Range = Document.Range;
var Coordinate = Document.Coordinate;
var PropertySelection = Document.PropertySelection;
var ContainerSelection = Document.ContainerSelection;
var TableSelection = Document.TableSelection;

/**
 * A class that maps DOM selections to model selections.
 *
 * There are some difficulties with mapping model selections:
 * 1. DOM selections can not model discontinuous selections, such as TableSelections or MultiSelections.
 * 2. Not all positions reachable via ContentEditable can be mapped to model selections. For instance,
 *    there are extra positions before and after non-editable child elements.
 * 3. Some native cursor behaviors need to be overidden, such as for navigating tables.
 *
 * @class SurfaceSelection
 * @constructor
 * @param {Element} rootElement
 * @module Surface
 */
function SurfaceSelection(rootElement, doc, container) {
  this.element = rootElement;
  this.doc = doc;
  this.container = container;
  this.state = new SurfaceSelection.State();
}

SurfaceSelection.Prototype = function() {

  function compareNodes(node1, node2) {
    var cmp = node1.compareDocumentPosition(node2);
    if (cmp&window.document.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    } else if (cmp&window.document.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    } else {
      return 0;
    }
  }

  function getPath(el) {
    return el.dataset.path.split('.');
  }

  // input methods:
  // - mouse down (setting cursor with mouse)
  // - keyboard cursor movement
  // - expand:
  //   - mouse dragging
  //   - cursor movement with shift

  // workflow for mapping from DOM to model:
  // 1. extract coordinates
  // 2. fixup coordinates
  // 3. create a model selection

  this.updateState = function(options) {
    options = options || {};
    var sel = window.getSelection();
    var anchorNode = sel.anchorNode;
    var anchorOffset = sel.anchorOffset;
    var focusNode = sel.focusNode;
    var focusOffset = sel.focusOffset;
    var isCollapsed = sel.isCollapsed;
    var isBackward = false;
    if (!isCollapsed && focusNode && anchorNode) {
      var cmp = compareNodes(focusNode, anchorNode);
      isBackward = ( cmp < 0 || (cmp === 0 && focusOffset < anchorOffset) );
    }
    if (!focusNode || !anchorNode) {
      this.state = null;
      return;
    }
    var startCoor, endCoor;
    if (isCollapsed) {
      if (isBackward) {
        startCoor = this.getModelCoordinate(focusNode, focusOffset, options);
      } else {
        startCoor = this.getModelCoordinate(anchorNode, anchorOffset, options);
      }
      endCoor = startCoor;
    } else {
      startCoor = this.getModelCoordinate(anchorNode, anchorOffset, options);
      endCoor = this.getModelCoordinate(focusNode, focusOffset, options);
      if (isBackward) {
        var tmp = endCoor;
        endCoor = startCoor;
        startCoor = tmp;
      }
    }
    this.state = new SurfaceSelection.State(isCollapsed, isBackward, startCoor, endCoor);
  };

  this.getModelCoordinate = function(node, offset, options) {
    var current = node;
    var propertyEl = null;
    while(current) {
      // if available extract a path fragment
      if (current.dataset && current.dataset.path) {
        propertyEl = current;
        break;
      } else {
        current = current.parentNode;
      }
    }
    if (!propertyEl) {
      return this.searchForCoordinate(node, offset, options);
    }
    var path = getPath(propertyEl);
    var charPos = this.computeCharPosition(propertyEl, node, offset);
    return new Coordinate(path, charPos);
  };

  this.computeCharPosition = function(propertyEl, endNode, offset) {
    var charPos = 0;
    function _getPosition(node) {
      if (endNode === node) {
        charPos += offset;
        return true;
      }
      if (node.nodeType === window.Node.TEXT_NODE) {
        charPos += node.textContent.length;
      } else if (node.nodeType === window.Node.ELEMENT_NODE) {
        // external nodes have a length of 1
        // they are attached to an invisible character
        // but may have a custom rendering
        if ($(node).data('external')) {
          charPos += 1;
          return false;
        }
        for (var childNode = node.firstChild; childNode; childNode = childNode.nextSibling) {
          if (_getPosition(childNode)) {
            return true;
          }
        }
      }
      return false;
    }
    var found = _getPosition(propertyEl);
    if (!found) {
      console.error('Could not find char position.');
      return 0;
    }
    // console.log('charPos', charPos);
    return charPos;
  };

  /**
   * Look up model coordinate by doing a search
   * on all available property elements.
   */
  this.searchForCoordinate = function(node, offset, options) {
    var elements = this.element.querySelectorAll('*[data-path]');
    var idx, idx1, idx2, cmp1, cmp2;
    idx1 = 0;
    idx2 = elements.length-1;
    cmp1 = compareNodes(elements[idx1], node);
    cmp2 = compareNodes(elements[idx2], node);
    while(true) {
      var l = idx2-idx1+1;
      if (cmp2 < 0) {
        idx = idx2;
        break;
      } else if (cmp1 > 0) {
        idx = idx1;
        break;
      } else if (l<=2) {
        idx = idx2;
        break;
      }
      var pivotIdx = idx1 + Math.floor(l/2);
      var pivotCmp = compareNodes(elements[pivotIdx], node);
      if (pivotCmp < 0) {
        idx1 = pivotIdx;
        cmp1 = pivotCmp;
      } else {
        idx2 = pivotIdx;
        cmp2 = pivotCmp;
      }
    }
    var path, charPos;
    if (options.direction === "left") {
      idx = Math.max(0, idx-1);
      charPos = elements[idx].textContent.length;
    } else if (cmp2<0) {
      charPos = elements[idx].textContent.length;
    } else {
      charPos = 0;
    }
    path = getPath(elements[idx]);
    return new Coordinate(path, charPos);
  };

  this.getSelection = function() {
    this.updateState();
    if (!this.state) {
      return Document.nullSelection;
    }
    var start = this.state.start;
    var end = this.state.end;
    // var reverse = this.state.reverse;
    var node1, node2, parent1, parent2, row1, col1, row2, col2;
    var range = new Range(start, end);
    if (_.isEqual(start.path, end.path)) {
      return new PropertySelection(range, this.state.reverse);
    } else {
      node1 = this.doc.get(start.path[0]);
      node2 = this.doc.get(end.path[0]);
      parent1 = node1.getRoot();
      parent2 = node2.getRoot();
      if (parent1.type === "table" && parent1.id === parent2.id) {
        // HACK make sure the table matrix has been computed
        parent1.getMatrix();
        row1 = node1.rowIdx;
        col1 = node1.colIdx;
        row2 = node2.rowIdx;
        col2 = node2.colIdx;
        return TableSelection.create(parent1.id, row1, col1, row2, col2);
      } else {
        return new ContainerSelection(this.container, range, this.state.reverse);
      }
    }
  };

  var _findDomPosition = function(element, offset) {
    if (element.nodeType === document.TEXT_NODE) {
      var l = element.textContent.length;
      if (l < offset) {
        return {
          node: null,
          offset: offset-l
        };
      } else {
        return {
          node: element,
          offset: offset,
          boundary: (l === offset)
        };
      }
    } else if (element.nodeType === document.ELEMENT_NODE) {
      if ($(element).data('external')) {
        return {
          node: null,
          offset: offset-1
        };
      }
      for (var child = element.firstChild; child; child = child.nextSibling) {
        var pos = _findDomPosition(child, offset);
        if (pos.node) {
          return pos;
        } else {
          // not found in this child; then pos.offset contains the translated offset
          offset = pos.offset;
        }
      }
    }
    return {
      node: null,
      offset: offset
    };
  };

  this._getDomPosition = function(path, offset) {
    var selector = '*[data-path="'+path.join('.')+'"]';
    var componentElement = this.element.querySelector(selector);
    if (!componentElement) {
      console.warn('Could not find DOM element for path', path);
      return null;
    }
    if (componentElement) {
      var pos = _findDomPosition(componentElement, offset);
      if (pos.node) {
        return pos;
      } else {
        return null;
      }
    }
  };

  this.setSelection = function(sel) {
    var wSel = window.getSelection();
    if (sel.isNull() || sel.isTableSelection() ) {
      return this.clear();
    }
    var range = sel.getRange();
    var startPosition = this._getDomPosition(range.start.path, range.start.offset);
    if (!startPosition) {
      return this.clear();
    }
    var endPosition;
    if (range.isCollapsed()) {
      endPosition = startPosition;
    } else {
      endPosition = this._getDomPosition(range.end.path, range.end.offset);
    }
    if (!endPosition) {
      return this.clear();
    }
    // if there is a range then set replace the window selection accordingly
    wSel.removeAllRanges();
    range = window.document.createRange();
    range.setStart(startPosition.node, startPosition.offset);
    range.setEnd(endPosition.node, endPosition.offset);
    wSel.addRange(range);
    this.state = new SurfaceSelection.State(sel.isCollapsed(), sel.isReverse(), range.start, range.end);
  };

  this.clear = function() {
    var sel = window.getSelection();
    sel.removeAllRanges();
    this.state = null;
  };

};

OO.initClass(SurfaceSelection);

SurfaceSelection.State = function(collapsed, reverse, start, end) {
  this.isCollapsed = collapsed;
  this.isReverse = reverse;
  this.start = start;
  this.end = end;
  Object.freeze(this);
};

module.exports = SurfaceSelection;
