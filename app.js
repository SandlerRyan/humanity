/*******
* DEPENDENCIES
********/

// Major dependencies
var app = require('./init/express');
var path = require('path');


var main = require('./routes/main');
var user = require('./routes/user');
// Models


/*******
* SERVER
********/
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



/*********
* ROUTES
*********/

// main routes for homepage, create/join game
app.get('/', main.homepage);
app.get('/lobby', main.lobby(io));

// user functionality
app.get('/login', user.login);
app.get('/logout', user.logout);

// routes for the games themselves


