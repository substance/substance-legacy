var OO = require('../basics/oo');
var Document = require('../document');

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
function SurfaceSelection(rootElement) {
  this.element = rootElement;
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

  this.updateState = function() {
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
        startCoor = this.getModelCoordinate(focusNode, focusOffset);
      } else {
        startCoor = this.getModelCoordinate(anchorNode, anchorOffset);
      }
      endCoor = startCoor;
    } else {
      startCoor = this.getModelCoordinate(anchorNode, anchorOffset);
      endCoor = this.getModelCoordinate(focusNode, focusOffset);
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
    var charPos;
    var range = window.document.createRange();
    range.setStart(propertyEl, 0);
    range.setEnd(node, offset);
    charPos = range.toString().length;
    charPos = Math.min(propertyEl.textContent.length, charPos);
    return new Document.Coordinate(path, charPos);
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
    return new Document.Coordinate(path, charPos);
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
