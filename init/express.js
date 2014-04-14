var express = require('express');
var path = require('path');

var app = express();

// settings
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// middleware
app.use(express.bodyParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(app.router);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.urlencoded());
app.use(express.methodOverride());

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// default listen on 3000
app.set('port', process.env.PORT || 3000);

// export the app.
module.exports = app;