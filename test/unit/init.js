//HACK: by now karma.qunit does not create qunit-fixture so we do need to create it on our own
QUnit.begin(function () {
  if ($('#qunit-fixture').length === 0) {
    $('body').append('<div id="qunit-fixture"></div>');
  }
});

QUnit.done(function () {
  $('#qunit-fixture').remove();
});
