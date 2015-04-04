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
    if (pos2 <= end) {
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
};

module.exports = {
  insertedText: insertedText,
  deletedText: deletedText
};
