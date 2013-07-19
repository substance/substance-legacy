var http = require('http');
var express = require('express');

var CommonJSServer = require("./lib/application/commonjs");
var Handlebars = require("handlebars");
var fs = require("fs");

var app = express();

var commonJSServer = new CommonJSServer(__dirname);
commonJSServer.update("./substance.js");

var index_template = Handlebars.compile(fs.readFileSync(__dirname + "/sandbox.hb").toString());

app.get("/",
  function(req, res, next) {
    var data = {
      scripts: commonJSServer.list()
    }
    var result = index_template(data);
    res.send(result);
  }
);

app.get(/\/?scripts\/\/?(.+)/,
  function(req, res, next) {
    var scriptPath = "/"+req.params[0];
    var script = commonJSServer.getScript(scriptPath)
    res.type('text/javascript');
    res.send(script);
  }
);

var port = process.env.PORT || 3000;
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

http.createServer(app).listen(port, function(){
  console.log("Substance-Box running on port " + port)
  console.log("http://127.0.0.1:"+port+"/");
});
