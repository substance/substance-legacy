sc.views.Testsuite = Backbone.View.extend({

  // Events
  // ------


  // Handlers
  // --------

  runTest: function(testName) {
    var that = this;
    var test = Substance.tests[testName];

    that.$('.test-results').empty();
    that.$('.test-results').removeClass('error success');

    test.on('action:success', function(err, action) {
      that.$('.test-results').append('<div class="action-successful">'+action.label.join(', ')+'. Success</div>');
    });

    test.on('action:error', function(err, action) {
      that.$('.test-results').append('<div class="action-error">'+err.toString()+'<br/><pre>'+JSON.stringify(err, null, '  ')+'</pre></div>');
    });

    test.run(function(err) {

    });

  },

  render: function () {
    this.$el.html(_.tpl('testsuite', {
      tests: Substance.tests
    }));
    return this;
  }
});