// Helpers
// ---------------

/**
 * Date.parse with progressive enhancement for ISO-8601, version 2
 * © 2010 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */
(function () {
    _.date = function (date) {
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
}());


// A fake console to calm down some browsers.
if (!window.console) {
  window.console = {
    log: function(msg) {
      // No-op
    }
  }
}



_.slug = function(str) {
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
}

_.scrollTop = function() {
  return document.body.scrollTop || document.documentElement.scrollTop;
}

// Render Underscore templates
s.util.tpl = function(tpl, ctx) {
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

s.util.classify = function(str) {
  return str[0].toUpperCase() + str.slice(1);
};


_.fullSelection = function(contentEditableElement)
{
  var range,selection;
  if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
  {
      range = document.createRange();//Create a range (a range is a like the selection but invisible)
      range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
      //range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      selection = window.getSelection();//get the selection object (allows you to change selection)
      selection.removeAllRanges();//remove any selections already made
      selection.addRange(range);//make the range you have just created the visible selection
  }
  else if(document.selection)//IE 8 and lower
  {
      range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
      range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
      range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      range.select();//Select the range (make it the visible selection
  }
}

_.prettyDate = function(time) {
  return jQuery.timeago(time);
};


_.stripTags = function(input, allowed) {
// Strips HTML and PHP tags from a string
//
// version: 1009.2513
// discuss at: http://phpjs.org/functions/strip_tags
// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   improved by: Luke Godfrey
// +      input by: Pul
// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   bugfixed by: Onno Marsman
// +      input by: Alex
// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +      input by: Marc Palau
// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +      input by: Brett Zamir (http://brett-zamir.me)
// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   bugfixed by: Eric Nagel
// +      input by: Bobby Drake
// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   bugfixed by: Tomasz Wesolowski
// +      input by: Evertjan Garretsen
// +    revised by: Rafał Kukawski (http://blog.kukawski.pl/)
// *     example 1: strip_tags('<p>Kevin</p> <b>van</b> <i>Zonneveld</i>', '<i><b>');
// *     returns 1: 'Kevin <b>van</b> <i>Zonneveld</i>'
// *     example 2: strip_tags('<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>', '<p>');
// *     returns 2: '<p>Kevin van Zonneveld</p>'
// *     example 3: strip_tags("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>", "<a>");
// *     returns 3: '<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>'
// *     example 4: strip_tags('1 < 5 5 > 1');
// *     returns 4: '1 < 5 5 > 1'
// *     example 5: strip_tags('1 <br/> 1');
// *     returns 5: '1  1'
// *     example 6: strip_tags('1 <br/> 1', '<br>');
// *     returns 6: '1  1'
// *     example 7: strip_tags('1 <br/> 1', '<br><br/>');
// *     returns 7: '1 <br/> 1'
   allowed = (((allowed || "") + "")
      .toLowerCase()
      .match(/<[a-z][a-z0-9]*>/g) || [])
      .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
   var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
       commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
   return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1){
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
   });
}
