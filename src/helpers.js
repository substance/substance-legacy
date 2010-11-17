// Helpers
// ---------------

var Helpers = {};

// Templates for the moment are recompiled every time
Helpers.renderTemplate = function(tpl, view, helpers) {
  source = $("script[name="+tpl+"]").html();
  var template = Handlebars.compile(source);
  return template(view, helpers || {});
};