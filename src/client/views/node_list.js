var NodeList = Backbone.View.extend({

  className: 'node-list',

  initialize: function (options) {
    this.state = 'read';
    this.level = options.level;
    this.root  = options.root;
    
    _.bindAll(this, 'addChild');
    this.model.bind('added-child', this.addChild);
    
    var childViews = this.childViews = [];
    this.model.get('children').each(_.bind(function (child) {
      childViews.push(this.createChildView(child));
    }, this));
  },

  eachChildView: function (fn) {
    _.each(this.childViews, fn);
  },

  eachControlsView: function (fn) {
    fn(this.firstControls);
    this.eachChildView(function (childView) {
      fn(childView.afterControls);
    });
  },

  transitionTo: function (state) {
    function transition (view) { view.transitionTo(state); }
    this.eachChildView(transition);
    this.eachControlsView(transition);
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
    var controls = new Controls({
      root: this.root,
      model: this.model,
      position: new Position(this.model, childView.model)
    });
    childView.afterControls = controls;
    var rendered = $([childView.render().el, controls.render().el]);
    
    var self = this;
    childView.model.bind('removed', function () {
      rendered.remove();
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
