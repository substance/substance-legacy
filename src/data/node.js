'use strict';

var Substance = require('../basics');

function Node( data ) {
  Substance.EventEmitter.call(this);
  this.properties = Substance.extend({}, this.getDefaultProperties(), data);
  this.properties.type = this.constructor.static.name;
  this.properties.id = this.properties.id || Substance.uuid(this.properties.type);
}

Node.Prototype = function() {

  this.toJSON = function() {
    return this.properties;
  };

  this.getDefaultProperties = function() {};

  this.isInstanceOf = function(typeName) {
    return Node.static.isInstanceOf(this.constructor, typeName);
  };

  this.getClassNames = function() {
    var classNames = [];
    var staticData = this.constructor.static;
    while (staticData && staticData.name !== "node") {
      classNames.push(staticData.name);
      staticData = Object.getPrototypeOf(staticData);
    }
    return classNames.join(' ');
  };

  this.getPropertyType = function(propertyName) {
    var schema = this.constructor.static.schema;
    return schema[propertyName];
  };

};

Substance.inherit( Node, Substance.EventEmitter );

/**
 * Symbolic name for this model class. Must be set to a unique string by every subclass.
 */
Node.static.name = "node";

Node.static.schema = {
  type: 'string',
  id: 'string'
};

Node.static.readOnlyProperties = ['type', 'id'];

Node.static.getPropertyType = function(propertyName) {
  // TODO: is this bound to Node.static?
  return this.schema[propertyName];
};

Node.static.matchFunction = function(/*el*/) {
  return false;
};

Node.static.isInstanceOf = function(NodeClass, typeName) {
  var staticData = NodeClass.static;
  while (staticData && staticData.name !== "node") {
    if (staticData && staticData.name === typeName) {
      return true;
    }
    staticData = Object.getPrototypeOf(staticData);
  }
  return false;
};


var defineProperty = function(prototype, property, readonly) {
  var getter, setter;
  getter = function() {
    return this.properties[property];
  };
  if (readonly) {
    setter = function() {
      throw new Error("Property " + property + " is readonly!");
    };
  } else {
    setter = function(val) {
      this.properties[property] = val;
      return this;
    };
  }
  var spec = {
    get: getter,
    set: setter
  };
  Object.defineProperty(prototype, property, spec);
};

var defineProperties = function(NodeClass) {
  var prototype = NodeClass.prototype;
  if (!NodeClass.static.schema) return;
  var properties = Object.keys(NodeClass.static.schema);
  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    if (prototype.hasOwnProperty(property)) continue;
    var readonly = ( NodeClass.static.readOnlyProperties &&
      NodeClass.static.readOnlyProperties.indexOf(property) > 0 );
    defineProperty(prototype, property, readonly);
  }
};

var extend;

var prepareSchema = function(NodeClass) {
  var schema = NodeClass.static.schema;
  var parentStatic = Object.getPrototypeOf(NodeClass.static);
  var parentSchema = parentStatic.schema;
  if (parentSchema) {
    NodeClass.static.schema = Substance.extend(Object.create(parentSchema), schema);
  }
}

var initNodeClass = function(NodeClass) {
  // add a extend method so that this class can be used to create child models.
  NodeClass.extend = Substance.bind(extend, null, NodeClass);
  // define properties and so on
  defineProperties(NodeClass);
  prepareSchema(NodeClass);
  NodeClass.type = NodeClass.static.name;
};

extend = function( parent, modelSpec ) {
  var ctor = function NodeClass() {
    parent.apply(this, arguments);
  };
  Substance.inherit(ctor, parent);
  for(var key in modelSpec) {
    if (modelSpec.hasOwnProperty(key)) {
      if (key === "name" || key === "properties") {
        continue;
      }
      ctor.prototype[key] = modelSpec[key];
    }
  }
  ctor.static.name = modelSpec.name;
  ctor.static.schema = modelSpec.properties;
  initNodeClass(ctor);
  return ctor;
};

initNodeClass(Node);

Node.initNodeClass = initNodeClass;

module.exports = Node;
