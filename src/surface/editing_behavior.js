var Substance = require('../basics');

var EditingBehavior = function() {
  this.merge = {};
  this.break = {};
};

EditingBehavior.Prototype = function() {

  this.mergeTextNodes = function(tx, firstPath, secondPath) {
    var firstText = tx.get(firstPath);
    var firstLength = firstText.length;
    var secondText = tx.get(secondPath);
    var containerNode = tx.get(this.containerName);
    // append the second text
    tx.update(firstPath, { insert: { offset: firstLength, value: secondText } });
    // transfer annotations
    Annotations.transferAnnotations(tx, secondPath, 0, firstPath, firstLength);
    // hide the second node
    containerNode.hide(secondPath[0]);
    // delete the second node
    tx.delete(secondPath[0]);
    // set the selection to the end of the first component
    tx.selection = Selection.create(firstPath, firstLength);
  };

  this.breakTextNode = function(tx, node, offset) {
    // split the text property and create a new paragraph node with trailing text and annotations transferred
    var text = node.content;
    var containerNode = tx.get(this.containerName);
    var path = [node.id, 'content'];
    var nodePos = containerNode.getPosition(node.id);
    var id = Substance.uuid(node.type);
    var newPath = [id, 'content'];

    // when breaking at the first position, a new node of the same
    // type will be inserted.
    if (offset === 0) {
      tx.create({
        id: id,
        type: node.type,
        content: ""
      });
      // show the new node
      containerNode.show(id, nodePos);
      tx.selection = Selection.create(path, 0);
    } else {
      // create a new node
      tx.create({
        id: id,
        type: 'text',
        content: text.substring(offset)
      });
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        Annotations.transferAnnotations(tx, path, offset, [id, 'content'], 0);
        // truncate the original property
        tx.update(path, {
          delete: { start: offset, end: text.length }
        });
      }
      // show the new node
      containerNode.show(id, nodePos+1);
      // update the selection
      tx.selection = Selection.create(newPath, 0);
    }
  };
};

Substance.initClass(EditingBehavior);

EditingBehavior.define = function(defFun) {
  function _EditingBehavior() {
    EditingBehavior.call(this);
    defFun.call(this);
  }
  _EditingBehavior.prototype = EditingBehavior.prototype;
  return _EditingBehavior;
};

module.exports = EditingBehavior;
