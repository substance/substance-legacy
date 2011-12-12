var NodeList = Backbone.View.extend({

  className: 'node-list',

  initialize: function (options) {
    this.level = options.level;
    this.root  = options.root;
    
    _.bindAll(this, 'addChild');
    this.model.bind('added-child', this.addChild);
    
    this.firstControls = new Controls({
      root: this.root,
      model: this.model,
      position: new Position(this.model, null)
    });
    
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

  addChild: function (child, index) {
    var childView = this.createChildView(child)
    ,   rendered  = this.renderChildView(childView);
    
    this.childViews.splice(index, 0, childView);
    rendered.insertAfter(index === 0 ? this.firstControls.el
                                     : this.childViews[index-1].afterControls.el);
    
    childView.transitionTo('write');
    childView.selectThis();
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
    
    childView.model.bind('removed', _.bind(function () {
      controls.remove();
      childView.remove();
      // Remove childView from the childViews array
      this.childViews = _.select(this.childViews, function (cv) {
        return cv !== childView;
      });
    }, this));
    return rendered;
  },

  render: function () {
    $(this.firstControls.render().el).appendTo(this.el);
    
    this.eachChildView(_.bind(function (childView) {
      this.renderChildView(childView).appendTo(this.el);
    }, this));
    
    return this;
  }

});
