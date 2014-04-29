var express = require('express');
var path = require('path');
var engine = require('ejs-locals');
var app = express();
var passport = require('passport');
var flash = require('connect-flash');

// pass passport for configuration
require('../config/passport.js')(passport);

app.use(express.logger('dev'));

// settings
app.set('view engine', 'ejs');
app.engine('ejs', engine);
app.set('views', path.join(__dirname, '../views'));

// middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.cookieParser()); // read cookies (needed for auth)
app.use(express.bodyParser());
app.use(express.json());
app.use(express.favicon());
app.use(express.urlencoded());
app.use(express.methodOverride());

// fb middleware
app.use(express.session({ secret: 'keyboard' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// flashing message through session
app.use(flash());

// sets session 'user' variable in all templates
app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});

app.use(app.router);



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// export the app and passport
var ex = [app,passport];
module.exports = ex;