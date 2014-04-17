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
app.get('/lobby', main.lobby);

io.sockets.on('connection', function(socket) {
	socket.on('new user', function(roomNumber) {

		socket.join(roomNumber)
		console.log(socket)

        //HOW TO lookup room and broadcast to that room
        io.sockets.in(roomNumber).emit('players');
		//SOLUTION: We should save the user in a DB and remove it when disconnected. SocketIO API might change
        //And we don't want it to break in case it does.

	});

});

// user functionality
app.get('/login', user.login);
app.get('/logout', user.logout);

// routes for the games themselves


