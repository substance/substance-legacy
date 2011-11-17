var NodeList = Backbone.View.extend({

  className: 'node-list',

  initialize: function (options) {
    this.parent = options.parent;
    this.level  = options.level;
    this.root   = options.root;
    
    _.bindAll(this, 'addChild');
    this.model.bind('added-child', this.addChild);
    
    var childViews = this.childViews = [];
    this.model.get('children').each(_.bind(function (child) {
      childViews.push(this.createChildView(child));
    }, this));
  },

  remove: function () {
    this.model.unbind('added-child', this.addChild);
    this.eachChildView(function (childView) {
      childView.remove();
    });
    $(this.el).remove();
  },

  eachChildView: function (fn) {
    _.each(this.childViews, fn);
  },

  transitionTo: function (state) {
    function transition (view) { view.transitionTo(state); }
    transition(this.firstControls);
    this.eachChildView(transition);
  },

  //select: function () {},

  deselect: function () {
    this.eachChildView(function (childView) {
      childView.deselect();
    });
  },

  addChild: function (child, index) {
    var childView = this.createChildView(child)
    ,   rendered  = this.renderChildView(childView);
    
    this.childViews.splice(index, 0, childView);
    rendered.insertAfter(index === 0 ? this.firstControls.el
                                     : $(this.childViews[index-1].afterControls.el));
    
    childView.transitionTo('write');
    childView.select();
    childView.focus();
  },

  createChildView: function (child) {
    return Node.create({
      parent: this.model,
      model: child,
      level: this.level + 1,
      root: this.root
    });
  },

  renderChildView: function (childView) {
    var controls = childView.afterControls;
    var rendered = $([childView.render().el, controls.render().el]);
    
    var self = this;
    childView.model.bind('removed', function () {
      controls.remove();
      childView.remove();
      // Remove childView from the childViews array
      self.childViews = _.select(self.childViews, function (cv) {
        return cv !== childView;
      });
    });
    return rendered;
  },

  render: function () {
    var self = this;
    
    this.firstControls = new Controls({
      root: this.root,
      model: self.model,
      position: new Position(self.model, null)
    });
    $(this.firstControls.render().el).appendTo(self.el);
    
    this.eachChildView(function (childView) {
      var rendered = self.renderChildView(childView).appendTo(self.el);
    });
    
    return this;
  }

});
