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
io.set('log level', 1);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



/*********
* ROUTES
*********/

// main routes for homepage, create/join game
app.get('/', main.homepage);
app.get('/lobby', main.lobby);
app.get('/game/:room', main.game);


var players = []

// helper function to find a player by their socket id
function find_player(ps, socket_id) {
	var n = ps.length;
	for(i = 0; i < n; i ++ ) {
		if (ps[i]['socket'] == socket_id) {
			return i;
		}
		else continue;
	}
	return false;
}

/*********************************************
* GAME SOCKET LOGIC
*********************************************/

var game = io.of('/game');

game.on('connection', function(client) {
	console.log('CONNECTED!!!');

	// add a new player and notify all the other players
	client.on('new player', function(data) {
		console.log('NEW USER JOINED!!!');
		// join the given room number
		this.join(data.room);

		// send the new player to all the other players
        game.in(data.room).emit('new player', data.player_id);
        // send all the other players to the new player
        game.emit('new player', players);

		// add to our player list
		players.push({'player': data.player_id, 'socket': this.id});
		console.log(players);

		//HOW TO lookup room and broadcast to that room
		//SOLUTION: We should save the user in a DB and remove it when disconnected. SocketIO API might change
        //And we don't want it to break in case it does.
	});


	// remove player from list when they disconnect
	client.on('disconnect', function() {
		console.log('PLAYER DISCONNECTED');
		var p = find_player(players, this.id);
		if (!p) {
			console.log('PLAYER NOT FOUND');
			return;
		}
		else {
			players.splice(p, 1);
			console.log(players);
		}
	});


});



// user functionality
app.get('/login', user.login);
app.get('/logout', user.logout);

// routes for the games themselves


