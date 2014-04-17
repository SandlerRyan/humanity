/*******
* DEPENDENCIES
********/

// Major dependencies
var app = require('./init/express');
var http = require('http');
var path = require('path');

var main = require('./routes/main');
// Models




/*********
* ROUTES
*********/
app.get('/', main.homepage);


/*******
* SERVER
********/
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});