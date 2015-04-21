var Substance = require('substance');
var $$ = React.createElement;
var Surface = Substance.Surface;
var _ = require("substance/helpers");
var TextProperty = require('./text_property');

// Container Node
// ----------------
//
// Represents a flat collection of nodes


// TODO: this is not Substance.Writer but should be in Archivist
// Plan: make this implementation an abstract mixin
// and let the application configure a componentFactory
// that provides a customized version.

var ContainerComponent = React.createClass({
  displayName: "ContainerComponent",

  contextTypes: {
    componentFactory: React.PropTypes.object.isRequired,
    notifications: React.PropTypes.object.isRequired
  },

  childContextTypes: {
    // provided to editor components so that they know in which context they are
    surface: React.PropTypes.object,
  },

  getInitialState: function() {
    var editor = new Surface.ContainerEditor(this.props.doc.get('content'));
    // HACK: this is also Archivist specific
    editor.defaultTextType = 'text';
    var options = {
      logger: this.context.notifications
    };
    this.surface = new Surface(editor, options);
    return {};
  },

  handleToggleSubjectReference: function(e) {
    e.preventDefault();
    var subjectReferenceId = e.currentTarget.dataset.id;
    var writerCtrl = this.props.writerCtrl;
    var state = writerCtrl.state;

    if (state.contextId === "editSubjectReference" && state.subjectReferenceId === subjectReferenceId) {
      writerCtrl.replaceState({
        contextId: "subjects"
      });
    } else {
      writerCtrl.replaceState({
        contextId: "editSubjectReference",
        subjectReferenceId: subjectReferenceId
      });
    }
  },

  getChildContext: function() {
    return {
      surface: this.surface
    };
  },

  render: function() {
    var containerNode = this.props.node;
    var doc = this.props.doc;
    var writerCtrl = this.props.writerCtrl;

    // Prepare subject reference components
    // ---------

    var subjectReferences = doc.getIndex('type').get('subject_reference');
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

    var virtualDOM = $$("div", {className: "interview-content", contentEditable: true, "data-id": "content"},
      $$("div", {
          className: "container-node " + this.props.node.id,
          spellCheck: false,
          "data-id": this.props.node.id
        },
        $$('div', {className: "nodes"}, components),
        $$('div', {className: "subject-references", contentEditable: false}, subjectRefComponents)
      )
    );
    return virtualDOM;
  },

  updateBrackets: function() {
    var doc = this.props.doc;
    var subjectReferences = doc.getIndex('type').get('subject_reference');

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

      if (!startAnchorEl || !endAnchorEl) {
        console.warn("FIXME: Could not find anchors for subject reference ", subjRef.id);
        return;
      }

      var startTop = $(startAnchorEl).position().top;
      var endTop = $(endAnchorEl).position().top + $(endAnchorEl).height();
      var height = endTop - startTop;

      var subjectRefEl = $(this.getDOMNode()).find('.subject-references .subject-reference[data-id='+subjRef.id+']');

      subjectRefEl.css({
        top: startTop,
        height: height
      });
    }, this);
  },

  componentDidMount: function() {
    var surface = this.surface;
    var doc = this.props.doc;

    doc.connect(this, {
      'document:changed': this.onDocumentChange
    });

    this.props.writerCtrl.registerSurface(surface, "content");
    surface.attach(this.getDOMNode());

    doc.connect(this, {
      'container-annotation-update': this.handleContainerAnnotationUpdate
    });

    var self = this;

    // TODO: we need a way so that the brackets get updated properly
    this.forceUpdate(function() {
      self.updateBrackets();
      self.surface.rerenderDomSelection();
    });

    $(window).resize(this.updateBrackets);
  },

  handleContainerAnnotationUpdate: function() {
    var self = this;
    this.forceUpdate(function() {
      self.updateBrackets();
    });
  },

  componentDidUpdate: function() {
    // HACK: when the state is changed this and particularly TextProperties
    // get rerendered (e.g., as the highlights might have changed)
    // Unfortunately we loose the DOM selection then.
    // Thus, we are resetting it here, but(!) delayed as otherwise the surface itself
    // might not have finished setting the selection to the desired and a proper state.
    if (!this.surface.__prerendering__) {
      var self = this;
      setTimeout(function() {
        self.surface.rerenderDomSelection();
      });
    }
  },

  componentWillUnmount: function() {
    var surface = this.surface;
    var doc = this.props.doc;
    doc.disconnect(this);
    this.props.writerCtrl.unregisterSurface(surface);
    surface.detach();
  },

  onDocumentChange: function(change) {
    // console.log('##### ContainerComponent.onDocumentChange', change);
    if (change.isAffected([this.props.node.id, 'nodes'])) {
      var self = this;
      // console.log('##### calling forceUpdate after document change');
      this.forceUpdate(function() {
        self.updateBrackets();
      });
    }
    // eagerly update brackets on every change
    else {
      this.updateBrackets();
    }
  }

});

module.exports = ContainerComponent;