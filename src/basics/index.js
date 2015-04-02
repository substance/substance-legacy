'use strict';

var uuid = require('./uuid');
var oo = require('./oo');
var PathAdapter = require('./path-adapter');
var EventEmitter = require('./event-emitter');
var SubstanceError = require('./error');
var Registry = require('./registry');
var Factory = require('./factory');

var Substance = require('./basics');

Substance.uuid = uuid;

Substance.initClass = oo.initClass;

Substance.inherit = oo.inherit;
Substance.inheritClass = oo.inheritClass;

Substance.mixin = oo.mixin;
Substance.mixinClass = oo.mixinClass;

Substance.PathAdapter = PathAdapter;

Substance.EventEmitter = EventEmitter;

Substance.Error = SubstanceError;

Substance.Registry = Registry;
Substance.Factory = Factory;

module.exports = Substance;
