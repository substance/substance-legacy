var $$ = React.createElement;

var FontAwesomeIcon = React.createClass({
  displayName: 'FontAwesomeIcon',
  render: function() {
    return $$('i', { className: "fa "+this.props.icon} );
  }
});

module.exports = FontAwesomeIcon;
