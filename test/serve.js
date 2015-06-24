var express = require('express');
var path = require('path');
var glob = require('glob');
var browserify = require('browserify');

var PORT = process.env.PORT || 4201;

var app = express();

app.get('/tests.js', function (req, res, next) {
  glob("test/**/*.test.js", {}, function (er, testfiles) {
    if (er || !testfiles || testfiles.length === 0) {
      console.error('No tests found.');
      res.send('500');
    } else {
      console.log('Found test files:', testfiles);
      browserify({ debug: true })
        .add(testfiles.map(function(file) {
          return path.join(__dirname, '..', file);
        }))
        .bundle()
        .on('error', function(err, data){
          console.error(err.message);
          res.send('console.log("'+err.message+'");');
        })
        .pipe(res);
    }
  });
});

app.use('/base', express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT);

console.log('QUnit server is listening on %s', PORT);
