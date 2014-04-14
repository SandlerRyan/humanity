/*******
* DEPENDENCIES
********/

// Major dependencies
var app = require('./init/express');
var http = require('http');
var path = require('path');

// Models





/*********
* ROUTES
*********/



/*******
* SERVER
********/
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});