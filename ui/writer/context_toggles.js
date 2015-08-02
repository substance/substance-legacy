
var Component = require('../component');
var $$ = Component.$$;
var Icon = require('../font_awesome_icon');

class ContextToggles extends Component {

  constructor(parent, props) {
    super(parent, props);

    this.onContextToggleClick = this.onContextToggleClick.bind(this);
  }

  render() {
    var panelOrder = this.props.panelOrder;
    var contextId = this.props.contextId;

    var toggleComps = [];
    _.each(panelOrder, function(panelId) {
      var panelClass = this.context.componentRegistry.get(panelId);
      var classNames = ["toggle-context"];
      if (panelClass.contextId === contextId) {
        classNames.push("active");
      }
      var toggle = $$('a', {
          key: panelClass.contextId,
          classNames: classNames.join(" "),
          href: "#",
          "data-id": panelClass.contextId,
        },
        $$(Icon, { icon: panelClass.icon }),
        $$('span', { classNames: 'label'}, panelClass.displayName)
      )
      toggleComps.push(toggle);
    }, this);

    return $$('div', { classNames: "context-toggles" }, toggleComps);
  }

  didMount() {
    this.$el.on('click', 'a.toggle-context', this.onContextToggleClick);
  }

  willUnmount() {
    this.$el.off('click');
  }

  onContextToggleClick(e) {
    e.preventDefault();
    var newContext = $(e.currentTarget).attr("data-id");
    this.send('switchContext', newContext);
  }

}

module.exports = ContextToggles;
