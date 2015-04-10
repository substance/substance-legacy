"use strict";

var Substance = require('../basics');

// A collection of methods to update annotations
// --------
//
// As we treat annotations as overlay of plain text we need to keep them up-to-date during editing.

var insertedText = function(doc, coordinate, length) {
  if (!length) return;
  var index = doc.getIndex('annotations');
  var annotations = index.get(coordinate.path);
  Substance.each(annotations, function(anno) {
    var pos = coordinate.offset;
    var start = anno.range[0];
    var end = anno.range[1];
    var changed = false;
    if ( (pos < start) ||
         (pos === start && coordinate.after) ) {
      start += length;
      changed = true;
    }
    if ( (pos < end) ||
         (pos === end && !coordinate.after) ) {
      end += length;
      changed = true;
    }
    if (changed) {
      doc.set([anno.id, 'range'], [start, end]);
    }
  });
  // same for container annotation anchors
  index = doc.getIndex('container-annotations');
  var anchors = index.get(coordinate.path);
  Substance.each(anchors, function(anchor) {
    var pos = coordinate.offset;
    var start = anchor.offset;
    var changed = false;
    if ( (pos < start) ||
         (pos === start && coordinate.after) ) {
      start += length;
      changed = true;
    }
    if (changed) {
      var property = (anchor.isStart?'startOffset':'endOffset');
      doc.set([anchor.id, property], start);
    }
  });
};

var deletedText = function(doc, path, startOffset, endOffset) {
  if (startOffset === endOffset) return;
  var index = doc.getIndex('annotations');
  var annotations = index.get(path);
  var length = endOffset - startOffset;
  Substance.each(annotations, function(anno) {
    var pos1 = startOffset;
    var pos2 = endOffset;
    var start = anno.range[0];
    var end = anno.range[1];
    if (pos2 <= start) {
      start -= length;
      end -= length;
      doc.set([anno.id, 'range'], [start, end]);
    } else {
      var changed = false;
      if (pos1 <= start) {
        var newStart = start - Math.min(pos2-pos1, start-pos1);
        if (start !== newStart) {
          start = newStart;
          changed = true;
        }
      }
      if (pos1 <= end) {
        var newEnd = end - Math.min(pos2-pos1, end-pos1);
        if (end !== newEnd) {
          end = newEnd;
          changed = true;
        }
      }
      if (changed) {
        // delete the annotation if it has collapsed by this delete
        if (start === end) {
          doc.delete(anno.id);
        } else {
          doc.set([anno.id, 'range'], [start, end]);
        }
      }
    }
  });
  // same for container annotation anchors
  index = doc.getIndex('container-annotations');
  var anchors = index.get(path);
  Substance.each(anchors, function(anchor) {
    var pos1 = startOffset;
    var pos2 = endOffset;
    var start = anchor.offset;
    var changed = false;
    if (pos2 <= start) {
      start -= length;
      changed = true;
    } else {
      if (pos1 <= start) {
        var newStart = start - Math.min(pos2-pos1, start-pos1);
        if (start !== newStart) {
          start = newStart;
          changed = true;
        }
      }
    }
    if (changed) {
      var property = (anchor.isStart?'startOffset':'endOffset');
      doc.set([anchor.id, property], start);
    }
  });
};

// used when breaking a node to transfer annotations to the new property
var transferAnnotations = function(doc, path, offset, newPath, newOffset) {
  var index = doc.getIndex('annotations');
  var annotations = index.get(path, offset);
  Substance.each(annotations, function(a) {
    var isInside = (offset > a.range[0] && offset < a.range[1]);
    var newRange;
    // 1. if the cursor is inside an annotation it gets either split or truncated
    if (isInside) {
      // create a new annotation if the annotation is splittable
      if (a.canSplit()) {
        var newAnno = Substance.clone(a.properties);
        newAnno.id = Substance.uuid(a.type + "_");
        newAnno.range = [newOffset, newOffset + a.range[1] - offset];
        newAnno.path = newPath;
        doc.create(newAnno);
      }
      // in either cases truncate the first part
      newRange = Substance.clone(a.range);
      newRange[1] = offset;
      // if after truncate the anno is empty, delete it
      if (newRange[1] === newRange[0]) {
        doc.delete(a.id);
      }
      // ... otherwise update the range
      else {
        doc.set([a.id, "range"], newRange);
      }
    }
    // 2. if the cursor is before an annotation then simply transfer the annotation to the new node
    else {
      // Note: we are preserving the annotation so that anything which is connected to the annotation
      // remains valid.
      newRange = [newOffset + a.range[0] - offset, newOffset + a.range[1] - offset];
      doc.set([a.id, "path"], newPath);
      doc.set([a.id, "range"], newRange);
    }
  });
  // same for container annotation anchors
  index = doc.getIndex('container-annotations');
  var anchors = index.get(path);
  Substance.each(anchors, function(anchor) {
    var start = anchor.offset;
    if (offset <= start) {
      var pathProperty = (anchor.isStart?'startPath':'endPath');
      var offsetProperty = (anchor.isStart?'startOffset':'endOffset');
      doc.set([anchor.id, pathProperty], newPath);
      doc.set([anchor.id, offsetProperty], newOffset + anchor.offset - offset);
    }
  });
};

module.exports = {
  insertedText: insertedText,
  deletedText: deletedText,
  transferAnnotations: transferAnnotations
};
