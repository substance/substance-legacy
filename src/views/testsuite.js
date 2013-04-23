sc.views.Testsuite = Backbone.View.extend({

  // Events
  // ------


  // Handlers
  // --------

  runTest: function(testName) {
    var that = this;
    var test = Substance.tests[testName];

    that.$('.test-results').removeClass('error success');
    test.run(function(err) {
      if(err) {

        that.$('.test-results').html(err.toString()+'<br/><pre>'+JSON.stringify(err, null, '  ')+'</pre>').addClass('error');
      } else {
        that.$('.test-results').html('Success').addClass('success');
      }
    });

  },

  render: function () {
    this.$el.html(_.tpl('testsuite', {
      tests: Substance.tests
    }));
    return this;
  }
});