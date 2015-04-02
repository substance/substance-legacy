'use strict';

var Substance = require('../basics');

function DocumentHistory(/*document*/) {
  this.cursor = -1;
  this.recoveryPoints = [];
  // this.chronicle = new Chronicle();
  this.chronicle = null;
}

DocumentHistory.Prototype = function() {

  this.setRecoveryPoint = function() {
    var current = this.chronicle.getState();
    if (this.recoveryPoints[this.cursor] !== current) {
      this.cursor++;
      this.recoveryPoints = this.recoveryPoints.slice(0, this.cursor);
      this.recoveryPoints[this.cursor] = current;
    }
  };

  this.restoreLastRecoveryPoint = function() {
    this.cursor--;
    var state = this.recoveryPoints[this.cursor] || "ROOT";
    this.chronicle.reset(state);
  };
};

Substance.initClass(DocumentHistory);

module.exports = DocumentHistory;
