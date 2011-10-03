
/**
 * Date.parse with progressive enhancement for ISO-8601, version 2
 * © 2010 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */
 
 var _ = {};
 
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


var HTMLRenderer = function(root) {
  // Implemented node types
  var renderers = {
    "/type/document": function(node, level) {
      var content = '<div class="document-title content">'+node.get('title')+'</div>';
      content += '<p class="published">'+_.date(node.get('published_on'))+'</p>';
      content += '<p class="lead content" id="document_lead">'+node.get('lead')+'</p>';
      content += '<div class="document-separator"></div>';
      
      node.all('children').each(function(child) {
        content += renderers[child.type._id](child, level+1);
      });
      return content;
    },
    
    "/type/article": function(node, level) {
      return renderers["/type/document"](node, level);
    },
    
    "/type/manual": function(node, level) {
      return renderers["/type/document"](node, level);
    },
    
    "/type/section": function(node, level) {
      var content = '';
      content += '<h'+level+' id="'+node.html_id+'">' + node.get('name') + '</h'+level+'>';
      
      node.all('children').each(function(child) {
        content += renderers[child.type._id](child, level+1);
      });
      
      return content;
    },
    
    "/type/text": function(node, level) {
      return '<div class="content-fragment">'+node.get('content')+'</div>';
    },
    
    "/type/quote": function(node, level) {
      return '<quote class="content-fragment">'+node.get('content')+'</quote>';
    },
    
    "/type/code": function(node, level) {
      return '<pre class="content-fragment" class="code">'+node.get('content')+'</pre>';
    },
    
    "/type/gist": function(node, level) {
      return '<pre class="content-fragment" class="code">'+node.get('content')+'</pre>';
    },    
    
    "/type/image": function(node, level) {
      return '<image class="content-fragment" src="'+node.get('url')+'"/>';
    },
    "/type/resource": function(node, level) {
      return '<image class="content-fragment" src="'+node.get('url')+'"/>';
    }
    
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type._id](root, 0);
    }
  };
};

module.exports = HTMLRenderer;