var Substance = require('substance');
var $$ = React.createElement;
var Surface = Substance.Surface;
var _ = require("substance/helpers");
var TextProperty = require('./text_property');

// Container Node
// ----------------
//
// Represents a flat collection of nodes

var ContainerComponent = React.createClass({
  displayName: "ContainerComponent",

  contextTypes: {
    componentFactory: React.PropTypes.object.isRequired
  },

  childContextTypes: {
    // provided to editor components so that they know in which context they are
    surface: React.PropTypes.object,
  },

  getInitialState: function() {
    return {
      surface: new Surface(new Surface.FullfledgedEditor('content', this.props.doc))
    };
  },

  handleToggleSubjectReference: function(e) {
    var subjectReferenceId = e.currentTarget.dataset.id;
    var writerCtrl = this.props.writerCtrl;

    if (writerCtrl.state.contextId === "editSubjectReference") {
      writerCtrl.replaceState({
        contextId: "subjects"
      });
    } else {
      writerCtrl.replaceState({
        contextId: "editSubjectReference",
        subjectReferenceId: subjectReferenceId
      });
    }

    // e.preventDefault();
  },

  getChildContext: function() {
    return {
      surface: this.state.surface
    };
  },

  render: function() {
    var containerNode = this.props.node;
    var doc = this.props.doc;
    var writerCtrl = this.props.writerCtrl;

    // Prepare subject reference components
    // ---------

    var subjectReferences = doc.subjectReferencesIndex.get();
    var subjectRefComponents = [];
    var activeContainerAnnotations = writerCtrl.getActiveContainerAnnotations();

    _.each(subjectReferences, function(sref) {
      subjectRefComponents.push($$('a', {
        className: "subject-reference"+(_.includes(activeContainerAnnotations, sref.id) ? ' selected' : ''),
        href: "#",
        "data-id": sref.id,
        onClick: this.handleToggleSubjectReference
      }));
    }, this);

    // Prepare container components (aka nodes)
    // ---------

    var componentFactory = this.context.componentFactory;
    var components = [$$(TextProperty, {
      doc: this.props.writerCtrl.doc,
      tagName: "div",
      className: "title",
      path: [ "document", "title"],
      writerCtrl: this.props.writerCtrl,
    })];
    components = components.concat(containerNode.nodes.map(function(nodeId) {
      var node = doc.get(nodeId);
      var ComponentClass = componentFactory.get(node.type);
      if (!ComponentClass) {
        throw new Error('Could not resolve a component for type: ' + node.type);
      }
      return $$(ComponentClass, {
        key: node.id,
        doc: doc,
        node: node,
        // TODO: we should use DI instead of coupling to the writer
        writerCtrl: writerCtrl
      });
    }));

    // Top level structure
    // ---------

    return $$("div", {className: "interview-content", contentEditable: true},
      $$("div", {
          className: "container-node " + this.props.node.id,
          spellCheck: false,
          "data-id": this.props.node.id
        },
        $$('div', {className: "nodes"}, components),
        $$('div', {className: "subject-references", contentEditable: false}, subjectRefComponents)
      )
    );
  },

  componentDidMount: function() {
    var surface = this.state.surface;
    this.props.doc.getEventProxy('path').add([this.props.node.id, 'nodes'], this, this.containerDidChange);
    this.props.writerCtrl.registerSurface(surface, "content");
    surface.attach(this.getDOMNode());

    // HACK: For initial rendering because text view depends on some view-related information
    // that gets available after the first render
    this.forceUpdate();

    $(window).resize(this.updateBrackets);
    this.updateBrackets();
  },

  updateBrackets: function() {
    var doc = this.props.doc;
    var subjectReferences = doc.subjectReferencesIndex.get();

    _.each(subjectReferences, function(subjRef) {
      var anchors = $(this.getDOMNode()).find('.nodes .anchor[data-id='+subjRef.id+']');

      var startAnchorEl, endAnchorEl;
      if ($(anchors[0]).hasClass('start-anchor')) {
        startAnchorEl = anchors[0];
        endAnchorEl = anchors[1];
      } else {
        startAnchorEl = anchors[1];
        endAnchorEl = anchors[0];
      }

      var startTop = $(startAnchorEl).position().top;
      var endTop = $(endAnchorEl).position().top;
      var height = endTop - startTop;

      var subjectRefEl = $(this.getDOMNode()).find('.subject-references .subject-reference[data-id='+subjRef.id+']');

      subjectRefEl.css({
        top: startTop,
        height: height
      });
    }, this);
  },

  componentWillUnmount: function() {
    var surface = this.state.surface;
    this.props.doc.getEventProxy('path').remove([this.props.node.id, 'nodes'], this);
    this.props.writerCtrl.unregisterSurface(surface);
    surface.detach();
  },

  containerDidChange: function() {
    var self = this;
    this.forceUpdate();
    // update the surface afterwards so that it can re-analyze the component layout
    setTimeout(function() {
      self.state.surface.update();
      self.updateBrackets();
    });
  },

});

module.exports = ContainerComponent;