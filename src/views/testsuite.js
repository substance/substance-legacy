sc.views.Testsuite = Substance.View.extend({

  // Events
  // ------

  events: {
    'click .run-all-tests': '_runAllTests',
    'click .tests .test': '_runTest'
  },


  _runAllTests: function() {
    console.log('running all tests');

    var funcs = [];
    var that = this;

    _.each(Substance.tests, function(test, testId) {
      funcs.push(function(cb) {
        that.runTest(testId, cb);
      });
    });

    Substance.util.async.sequential(funcs, function(err) {
      // All successful?
    });

    return false;
  },

  _runTest: function(e) {
    var testName = $(e.currentTarget).attr('id');
    this.runTest(testName);
    return false;
  },

  // Handlers
  // --------

  runTest: function(testName, cb) {
    var that = this;
    var test = Substance.tests[testName];

    that.$('.test-results').empty();
    that.$('.test-results').removeClass('error success');

    test.off('action:success');
    test.off('action:error');
    test.on('action:success', function(err, action) {
      that.$('.test-results').append('<div class="action-success"><i class="icon-ok"></i>'+action.label.join(', ')+'. Success</div>');
    });

    test.on('action:error', function(err, action) {
      that.$('.test-results').append('<div class="action-error"><i class="icon-exclamation-sign"></i>'+err.toString()+'<br/><pre>'+JSON.stringify(err, null, '  ')+'</pre></div>');
    });

    test.run(function(err) {
      if (err) {
        that.$('#'+testName).addClass('error');
        that.$('#'+testName+' i').addClass('icon-exclamation-sign');
      } else {
        that.$('#'+testName).addClass('success');
        that.$('#'+testName+' i').addClass('icon-ok');
      }
      if (cb) cb(null);
    });

  },

  render: function () {
    this.$el.html(_.tpl('testsuite', {
      tests: Substance.tests
    }));
    return this;
  },

  dispose: function() {
    console.log('disposing testsuite view');
    this.disposeBindings();
  }

});