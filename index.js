'use strict';

var uuid = require('./src/uuid');
var oo = require('./src/oo');
var PathAdapter = require('./src/path-adapter');
var EventEmitter = require('./src/event-emitter');
var SubstanceError = require('./src/error');

var Substance = require('./src/basics');

Substance.uuid = uuid;

Substance.initClass = oo.initClass;

Substance.inherit = oo.inherit;
Substance.inheritClass = oo.inheritClass;

Substance.mixin = oo.mixin;
Substance.mixinClass = oo.mixinClass;

Substance.PathAdapter = PathAdapter;

Substance.EventEmitter = EventEmitter;

Substance.Error = SubstanceError;

module.exports = Substance;
