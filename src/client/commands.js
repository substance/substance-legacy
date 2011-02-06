// AddCriterion
// ---------------

var AddCriterion = function(app, options) {
  this.app = app;
  this.options = options;
};

// [c1, c2, !c1]  => [c2]
AddCriterion.prototype.matchesInverse = function(other) {
  return (
    other instanceof RemoveCriterion && 
    this.options.property === other.options.property && 
    this.options.operator === 'CONTAINS' && other.options.operator === 'CONTAINS' &&
    this.options.value === other.options.value
  );
};

// [c1, c2, c1~]  => [c1~, c2]
// eg. c1 = population > 2000000, c1~ = population > 10000000
AddCriterion.prototype.matchesOverride = function() {
  // TODO: implement
};

AddCriterion.prototype.execute = function() {
  this.graph = app.browser.graph;
  
  var criterion = new Data.Criterion(this.options.operator, '/type/document', this.options.property, this.options.value);
  app.browser.graph = app.browser.graph.filter(criterion);
  
  this.app.facets.addChoice(this.options.property, this.options.operator, this.options.value);
};

AddCriterion.prototype.unexecute = function() {
  app.browser.graph = this.graph; // restore the old state
  this.app.facets.removeChoice(this.options.property, this.options.operator, this.options.value);
};


// RemoveCriterion
// ---------------

var RemoveCriterion = function(app, options) {
  this.app = app;
  this.options = options;
};

RemoveCriterion.prototype.execute = function() {
  // won't be executed
};

RemoveCriterion.prototype.unexecute = function() {
  // won't be unexecuted
};
