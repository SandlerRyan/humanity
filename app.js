/*******
* DEPENDENCIES
********/

// Major dependencies
var app = require('./init/express');
var passport = require('./init/passport');
var path = require('path');
var main = require('./routes/main');
var user = require('./routes/user');

// Models
var Player = require('./models/Player');
var Game = require('./models/Game');


/*******
* SERVER
********/
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
io.set('log level', 1);
app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'), 'localhost', function(){
  console.log('Express server listening on port ' + app.get('port'));
});


/*********
* ROUTES
*********/

// main routes for homepage, create/join game
app.get('/', main.homepage);
app.get('/lobby', main.lobby);
app.get('/game/:room', main.game);
app.get('/create/:player_id', main.create);

// user functionality

// =====================================
// FACEBOOK ROUTES =====================
// =====================================
// route for facebook authentication and login

//passport
app.use(passport.initialize());
// persistent login sessions
app.use(passport.session()); 

app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

var test = require('./routes/test');
app.get('/test', test.test1);

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect : '/homepage',
		failureRedirect : '/'
	}));

// route for logging out
app.get('/logout', function(req, res) {
	console.log(req.user);
	res.redirect('/');
});

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}


var players = {};

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


function find_judge_socket(room_id) {
	return 1;
}
/*********************************************
* LOBBY SOCKET LOGIC
*********************************************/
var lobby = io.of('/lobby');

lobby.on('connection', function(client) {
	setInterval(function() {
		Game.collection()
		.query('where', {active:1, started:0}).fetch()
		.then(function(games) {
			client.emit('games', games);
		}).catch(function(e) {
			console.log(e.stack);
			res.json(400, {error: e.message});
		});
	}, 5000);
});


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
        game.in(data.room).emit('new player', data.player);
        // send all the other players to the new player
        game.emit('new player', players);

		// add to our player list
		try {
			players[data.room].push({'player': data.player, 'socket': this.id});
		}
		// or if room has just been created, add it to the players object
		catch (e) {
			players[data.room] = [];
			players[data.room].push({'player': data.player, 'socket': this.id});
		}
		console.log(players);

	});

	client.on('emit player response', function(data) {
		console.log("IM HERE")
		console.log(data)
		var judge = find_judge_socket(data.room);
		console.log(client[0])
		game.socket(players[0].socket).emit("player submission", data)
	})
	// remove player from list when they disconnect
	client.on('disconnect', function() {
		console.log('PLAYER DISCONNECTED');

		// get the rooms the player has joined
		rooms = io.sockets.manager.roomClients[client.id];
		for(i = 0; i < rooms.length; i++) {
			var room = rooms[i];
			var p = find_player(players[room], client.id);
			if (p === false) {
				console.log('PLAYER NOT FOUND');
				return;
			}
			else {
				players[room].splice(p, 1);
				console.log(players);
			}
		}
	});

});
