// Helpers
// ---------------

// A fake console to calm down some browsers.
if (!window.console) {
  window.console = {
    log: function(msg) {
      // No-op
    }
  };
}

/**
 * Date.parse with progressive enhancement for ISO-8601, version 2
 * © 2010 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */
s.util.date = function (date) {
  var timestamp = Date.parse(date), minutesOffset = 0, struct;
  if (isNaN(timestamp) && (struct = /^(\d{4}|[+\-]\d{6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?))?/.exec(date))) {
    if (struct[8] !== 'Z') {
      minutesOffset = +struct[10] * 60 + (+struct[11]);
      
      if (struct[9] === '+') {
        minutesOffset = 0 - minutesOffset;
      }
    }
    
    timestamp = Date.UTC(+struct[1], +struct[2] - 1, +struct[3], +struct[4], +struct[5] + minutesOffset, +struct[6], +struct[7].substr(0, 3));
  }
  
  return new Date(timestamp).toDateString();
};

s.util.slug = function (str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();
  
  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  
  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
  
  return str;
};

// Render Underscore templates
s.util.tpl = function (tpl, ctx) {
  var source = templates[tpl];
  return _.template(source, ctx);
};

s.util.browserSupported = function () {
  if (head.browser.mozilla && head.browser.version > "1.9.2") {
    return true;
  }
  if (head.browser.webkit && head.browser.version > "533.0") {
    return true;
  }
  if (head.browser.opera && head.browser.version > "11.0") {
    return true;
  }
  // if (head.browser.ie && head.browser.version > "9.0") {
  //   return true;
  // }
  return false;
};

s.util.prettyDate = function (time) {
  return time ? jQuery.timeago(time) : "";
};

s.util.escape = function (s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
};

s.util.unescape = function (s) {
  return s.replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&gt;/g,   '>')
          .replace(/&lt;/g,   '<')
          .replace(/&amp;/g,  '&');
};