var sanitize = function (html, settings) {
  settings = settings || {};
  var sanitized = '';
  
  function advance (n) {
    if (typeof n === 'string') {
      sanitized += n;
      n = n.length;
    }
    html = html.slice(n);
  }
  
  var match;
  while (html.length) {
    if (match = html.match(/^[^<]+/)) { // cdata
      sanitized += match[0].replace(/>/g, '&gt;')
      advance(match[0].length);
      continue;
    }
    
    var endPos = html.indexOf('>');
    
    if (endPos === -1) {
      // discard tag
      advance(html.length);
      continue;
    }
    
    var tag = html.slice(0, endPos+1);
    
    if (match = tag.match(/^<\/([a-zA-Z]+)>$/)) { // end tag
      var tagName = match[1];
      advance(settings[tagName] ? match[0] : match[0].length);
      continue;
    }
    
    if (match = tag.match(/^<([a-zA-Z]+)(?:\s+(.+))?\s*\/?>$/)) {
      var tagName = match[1].toLowerCase()
      ,   attrs   = match[2];
      
      if (settings[tagName]) {
        var attributes = {};
        while (attrs) { // read attributes
          var key = attrs.match(/^[a-zA-Z]+/);
          if (!key) break;
          key = key[0];
          attrs = attrs.slice(key.length);
          
          if (attrs[0] === '=') {
            attrs = attrs.slice(1);
            if (/['"]/.exec(attrs[0])) {
              var quote = attrs[0];
              var closingPos = attrs.indexOf(quote, 1);
              if (closingPos === -1) break;
              attributes[key] = attrs.slice(1, closingPos);
              attrs = attrs.slice(closingPos+1);
            } else if (!attrs[0].exec(/\s/)) {
              var value = attrs.match(/^[^\s]+/);
              if (!value) break;
              value = value[0];
              attrs = attrs.slice(value.length);
              attributes[key] = value;
            } else {
              break;
            }
          } else if (attrs[0].exec(/\s/)) {
            attributes[key] = key;
          } else {
            break;
          }
          
          var ws = attrs.match(/^\s+/);
          if (!ws) break;
          attrs = attrs.slice(ws[0].length);
        }
        
        sanitized += '<'+tagName;
        
        // validate and write attributes
        for (var key in attributes) {
          var validator;
          if (attributes.hasOwnProperty(key) && (validator = settings[tagName][key])) {
            var value = attributes[key].replace(/"/g, '&quot;');
            if (typeof validator === 'function' && !validator(value)) continue;
            sanitized += ' '+key+'="'+value+'"';
          }
        }
        
        sanitized += '>';
      }
    }
    
    advance(tag.length);
  }
  
  return sanitized;
}

if (typeof exports === 'object') {
  exports.sanitize = sanitize;
}