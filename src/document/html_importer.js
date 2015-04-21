var Substance = require('../basics');

function HtmlImporter( config ) {

  this.config = config || {};

  this.nodeTypes = [];

  this.blockTypes = [];

  this.inlineTypes = [];

  // register converters defined in schema
  if (config.schema) {
    config.schema.each(function(NodeClass) {
      // ATM Node.matchElement is required
      if (!NodeClass.static.matchElement) {
        return;
      }
      this.nodeTypes.push(NodeClass);
      if (NodeClass.static.blockType) {
        this.blockTypes.push(NodeClass);
      } else {
        this.inlineTypes.push(NodeClass);
      }
    }, this);
  }
}

HtmlImporter.Prototype = function HtmlImporterPrototype() {

  this.defaultConverter = function(/*el, converter*/) {
    console.warn('This element is not handled by the converters you provided. This is the default implementation which just skips conversion. Override HtmlImporter.defaultConverter(el, converter) to change this behavior.');
  };

  this.initialize = function(doc, rootEl) {
    var state = {
      doc: doc,
      rootEl: rootEl,
      inlineNodes: [],
      trimWhitespaces: !!this.config.trimWhitespaces,
      // properties
      contexts: [],
      // state for reentrant calls
      reentrant: null,
      lastChar: "",
      skipTypes: {},
      ignoreAnnotations: false,
    };
    if (!doc.get('content')) {
      doc.create({
        'type': 'container',
        'id': 'content',
        nodes: []
      });
    }
    state.containerNode = doc.get('content');
    this.state = state;
  };

  this.convert = function(rootEl, doc) {
    this.initialize(doc, rootEl);
    this.body(rootEl);
    // create annotations afterwards so that the targeted nodes
    // exist for sure
    for (var i = 0; i < this.state.inlineNodes.length; i++) {
      doc.create(this.state.inlineNodes[i]);
    }
  };

  this.convertDocument = function(htmlDoc, doc) {
    var body = htmlDoc.getElementsByTagName( 'body' )[0];
    body = this.sanitizeHtmlDoc(body);
    console.log('Sanitized html:', body.innerHTML);

    this.initialize(doc, body);
    this.body(body);
    // create annotations afterwards so that the targeted nodes
    // exist for sure
    for (var i = 0; i < this.state.inlineNodes.length; i++) {
      doc.create(this.state.inlineNodes[i]);
    }
  };

  this.sanitizeHtmlDoc = function(body) {
    var newRoot = body;
    // Look for paragraphs in <b> which is served by GDocs.
    var gdocs = body.querySelector('b > p');
    if (gdocs) {
      return gdocs.parentNode;
    }
    return newRoot;
  };

  this.convertElement = function(el) {
    var doc = this.state.doc;
    var nodeType = this._getNodeTypeForElement(el);
    if (!nodeType) {
      console.error("Could not find a node class associated to element", el);
      throw new Error("Could not find a node class associated to element");
    }
    var node = nodeType.static.fromHtml(el, this);
    node.type = nodeType.static.name;
    node.id = node.id || Substance.uuid(node.type);
    doc.create(node);
    return node;
  };

  this.body = function(body) {
    var state = this.state;
    var doc = state.doc;
    var containerNode = state.containerNode;
    var childIterator = new HtmlImporter.ChildNodeIterator(body);
    while(childIterator.hasNext()) {
      var el = childIterator.next();
      var blockType = this._getBlockTypeForElement(el);
      var node;
      if (blockType) {
        node = blockType.static.fromHtml(el, this);
        if (!node) {
          throw new Error("Contract: a Node's fromHtml() method must return a node");
        } else {
          node.type = blockType.static.name;
          node.id = node.id || Substance.uuid(node.type);
          doc.create(node);
          containerNode.show(node.id);
        }
      } else {
        if (el.nodeType === window.Document.COMMENT_NODE) {
          // skip comment nodes on block level
        } else if (el.nodeType === window.Document.TEXT_NODE) {
          var text = el.textContent;
          if (/\s*/.exec(text)) {
            // only whitespace, then skipping is fine
          } else {
            console.warn("Skipping text-node on block level with content:", text);
          }
        } else if (el.nodeType === window.Document.ELEMENT_NODE) {
          node = this.defaultConverter(el, this);
          if (node) {
            if (!node.type) {
              throw new Error('Contract: Html.defaultConverter() must return a node with type.');
            }
            node.id = node.id || Substance.uuid(node.type);
            doc.create(node);
            containerNode.show(node.id);
          }
        }
      }
    }
  };

  /**
   * Parse annotated text
   *
   * Make sure you call this method only for elements where `this.isParagraphish(elements) === true`
   */
  this.annotatedText = function(el, path, options) {
    options = options || {};
    var state = this.state;
    if (path) {
      if (state.reentrant) {
        throw new Error('Contract: it is not allowed to bind a new call annotatedText to a path while the previous has not been completed.');
      }
      state.contexts.push({
        path: path
      });
      state.reentrant = {
        offset:options.offset || 0,
        text: ""
      };
    }
    var iterator = new HtmlImporter.ChildNodeIterator(el);
    var text = this._annotatedText(iterator);
    // append the text of the last reentrant call
    // state.reentrant.text = state.reentrant.text.concat(text);
    if (path) {
      state.contexts.pop();
      state.reentrant = null;
    }
    return text;
  };

  // Internal function for parsing annotated text
  // --------------------------------------------
  //
  this._annotatedText = function(iterator) {
    var state = this.state;
    var context = state.contexts[state.contexts.length-1];
    var reentrant = state.reentrant;
    var plainText = "";
    if (!reentrant) {
      throw new Error('Illegal state: state.reentrant is null.');
    }
    while(iterator.hasNext()) {
      var el = iterator.next();
      // Plain text nodes...
      if (el.nodeType === window.Document.TEXT_NODE) {
        var text = this._prepareText(state, el.textContent);
        if (text.length) {
          // Note: text is not merged into the reentrant state
          // so that we are able to return for this reentrant call
          plainText = plainText.concat(text);
          reentrant.offset += text.length;
        }
      } else if (el.nodeType === window.Document.COMMENT_NODE) {
        // skip comment nodes
        continue;
      } else {
        var inlineType = this._getInlineTypeForElement(el);
        if (!inlineType) {
          var blockType = this._getInlineTypeForElement(el);
          if (blockType) {
            throw new Error('Expected inline element. Found block element:', el);
          }
          console.warn('Unsupported inline element. We will not create an annotation for it, but process its children to extract annotated text.', el);
          plainText = plainText.concat(this.annotatedText(el));
          continue;
        }
        // reentrant: we delegate the conversion to the inline node class
        // it will either call us back (this.annotatedText) or give us a finished
        // node instantly (self-managed)
        var startOffset = reentrant.offset;
        var inlineNode;
        if (inlineType.static.fromHtml) {
          inlineNode = inlineType.static.fromHtml(el, this);
          if (!inlineNode) {
            throw new Error("Contract: a Node's fromHtml() method must return a node");
          }
        } else {
          inlineNode = {};
          plainText = plainText.concat(this.annotatedText(el));
        }
        // in the mean time the offset will probably have changed to reentrant calls
        var endOffset = reentrant.offset;
        inlineNode.type = inlineType.static.name;
        inlineNode.id = inlineType.id || Substance.uuid(inlineNode.type);
        inlineNode.range = [startOffset, endOffset];
        inlineNode.path = context.path.slice(0);
        state.inlineNodes.push(inlineNode);
      }
    }
    // return the plain text collected during this reentrant call
    return plainText;
  };

  this.getCurrentPath = function() {
    var currentContext = this.state.contexts[this.state.contexts.length-1];
    return currentContext.path;
  };

  this._getBlockTypeForElement = function(el) {
    // HACK: tagName does not exist for prmitive nodes such as DOM TextNode.
    if (!el.tagName) return null;
    for (var i = 0; i < this.blockTypes.length; i++) {
      if (this.blockTypes[i].static.matchElement(el)) {
        return this.blockTypes[i];
      }
    }
  };

  this._getInlineTypeForElement = function(el) {
    for (var i = 0; i < this.inlineTypes.length; i++) {
      if (this.inlineTypes[i].static.matchElement(el)) {
        return this.inlineTypes[i];
      }
    }
  };

  this._getNodeTypeForElement = function(el) {
    for (var i = 0; i < this.nodeTypes.length; i++) {
      if (this.nodeTypes[i].static.matchElement(el)) {
        return this.nodeTypes[i];
      }
    }
  };

  this._getDomNodeType = function(el) {
    if (el.nodeType === window.Document.TEXT_NODE) {
      return "text";
    } else if (el.nodeType === window.Document.COMMENT_NODE) {
      return "comment";
    } else if (el.tagName) {
      return el.tagName.toLowerCase();
    } else {
      throw new Error("Unknown node type");
    }
  };

  var WS_LEFT = /^\s+/g;
  var WS_LEFT_ALL = /^\s*/g;
  var WS_RIGHT = /\s+$/g;
  var WS_ALL = /\s+/g;
  // var ALL_WS_NOTSPACE_LEFT = /^[\t\n]+/g;
  // var ALL_WS_NOTSPACE_RIGHT = /[\t\n]+$/g;
  var SPACE = " ";
  var TABS_OR_NL = /[\t\n\r]+/g;

  this._prepareText = function(state, text) {
    if (!state.trimWhitespaces) {
      return text;
    }
    // EXPERIMENTAL: drop all 'formatting' white-spaces (e.g., tabs and new lines)
    // (instead of doing so only at the left and right end)
    //text = text.replace(ALL_WS_NOTSPACE_LEFT, "");
    //text = text.replace(ALL_WS_NOTSPACE_RIGHT, "");
    text = text.replace(TABS_OR_NL, SPACE);
    if (state.lastChar === SPACE) {
      text = text.replace(WS_LEFT_ALL, SPACE);
    } else {
      text = text.replace(WS_LEFT, SPACE);
    }
    text = text.replace(WS_RIGHT, SPACE);
    // EXPERIMENTAL: also remove white-space within
    if (this.config.REMOVE_INNER_WS) {
      text = text.replace(WS_ALL, SPACE);
    }
    state.lastChar = text[text.length-1] || state.lastChar;
    return text;
  };

};
HtmlImporter.prototype = new HtmlImporter.Prototype();

HtmlImporter.ChildNodeIterator = function(arg) {
  this.nodes = arg.childNodes;
  this.length = this.nodes.length;
  this.pos = -1;
};

HtmlImporter.ChildNodeIterator.Prototype = function() {
  this.hasNext = function() {
    return this.pos < this.length - 1;
  };
  this.next = function() {
    this.pos += 1;
    return this.nodes[this.pos];
  };
  this.back = function() {
    if (this.pos >= 0) {
      this.pos -= 1;
    }
    return this;
  };
};
HtmlImporter.ChildNodeIterator.prototype = new HtmlImporter.ChildNodeIterator.Prototype();

module.exports = HtmlImporter;
