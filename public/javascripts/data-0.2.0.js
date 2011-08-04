// Data.Criterion
// --------------

// Deprecated. Will be removed with 0.3.0. Use Data.Graph.find instead

Data.Criterion = function (operator, type, property, value) {
  this.operator = operator;
  this.type = type;
  this.property = property;
  this.value = value;
  this.children = [];
};

Data.Criterion.operators = {};

_.extend(Data.Criterion.operators, {
  
  // Logical Connectors
  
  AND: function(target, criteria) {
    if (criteria.length === 0) return new Data.Hash();
    var result = criteria[0].run(target);
    for(var i=1; i < criteria.length; i++) {
      result = result.intersect(criteria[i].run(target));
    }
    return result;
  },

  OR: function(target, criteria) {
    var result = new Data.Hash();
    for(var i=0; i < criteria.length; i++) {
      result = result.union(criteria[i].run(target));
    }
    return result;
  },

  // Logical Operators
  
  CONTAINS: function(target, typeKey, propertyKey, value) {
    var type = target.get('nodes', typeKey),
        property = type.get('properties', propertyKey),
        v = property.get('values', value);
    
    // Only return results within the requested type range
    return v.referencedObjects.select(function(obj, key) {
      return _.include(obj.types().keys(), typeKey);
    });
  },
  
  // Only works with value type properties
  GT: function(target, typeKey, propertyKey, value) {
    var type = target.get('nodes', typeKey),
        property = type.get('properties', propertyKey),
        values = property.all('values'),
        matchedObjects = new Data.Hash();
        
    values = values.select(function(v) {
      return v.val >= value;
    });
    
    values.each(function(v) {
      matchedObjects = matchedObjects.union(v.referencedObjects);
    });
    return matchedObjects;
  }
});

_.extend(Data.Criterion.prototype, {
  add: function(criterion) {
    this.children.push(criterion);
    return this;
  },

  // Run criterion against a Data.Graph (target)
  // TODO: allow Data.Collections to be passed here too,
  // for Collections the type attribute can be derived automatically.
  run: function(target) {
    if (this.operator === "AND") {
      return Data.Criterion.operators.AND(target, this.children);
    } else if (this.operator === "OR") {
      return Data.Criterion.operators.OR(target, this.children);
    } else {
      // Leaf nodes
      return Data.Criterion.operators[this.operator](target, this.type, this.property, this.value);
    }
  }
});



// Perform a filter on the graph. Expects `Data.Criterion` object
// describing the filter conditions
// DEPRECATED, will be removed with 0.3.0
Data.Graph.prototype.filter = function(criteria) {
  var g2 = {};
  
  // Include schema information from the original graph
  this.types().each(function(type, key) {
    g2[key] = type.toJSON();
  });
  
  // Include all other objects that do not match the target type
  // KNOWN BUG: this assumes that all type properties on all nested criterion
  // objects have the same type
  this.objects().each(function(obj, key) {
    if (!_.include(obj.types().keys(), criteria.type)) g2[key] = obj.toJSON();
  });
  
  // Include matched object nodes
  criteria.run(this).each(function(obj, key) {
    g2[key] = obj.toJSON();
  });
  
  return new Data.Graph(g2);
};