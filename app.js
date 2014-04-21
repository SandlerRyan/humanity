/*******
* DEPENDENCIES
********/

// Major dependencies
var ex = require('./init/express');
var app = ex[0];
var passport = ex[1];

var path = require('path');
var main = require('./routes/main');
var user = require('./routes/user');
var express  = require('express');


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


var path = require('path');
var main = require('./routes/main');
var user = require('./routes/user');
/*********
* ROUTES
*********/

// main routes for homepage, create/join game
app.get('/', main.homepage);

app.get('/lobby', main.lobby);
app.get('/game/:room', main.game);
app.get('/create', main.create);

// user functionality

// =====================================
// FACEBOOK ROUTES =====================
// =====================================

app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));


// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect : '/',
		failureRedirect : '/'
	}));

// route for logging out
app.get('/logout', function(req, res) {
	res.redirect('/');
});

/*********************************************
* LOBBY SOCKET LOGIC
*********************************************/
var lobby = io.of('/lobby');

lobby.on('connection', function(socket) {
	setInterval(function() {
		Game.collection()
		.query('where', {active:1, started:0}).fetch()
		.then(function(games) {
			socket.emit('games', games);
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

game.on('connection', function(socket) {
	console.log('CONNECTED!!!');

	// add a new player and notify all the other players
	socket.on('new player', function(data) {
		console.log('NEW USER JOINED!!!');
		// join the given room number
		this.join(data.room);

		// send the new player to all the other players
        // game.in(data.room).emit('new player', data.player);
        // send all the other players to the new player
        // game.emit('new player', players);

        Game.find(data.room).then(function (model) {
        	// tell the client side who the creator is so a start button can be rendered
        	if (model.get('creator_id') == data.player.id) {
        		game.emit('creator', {});
        	}
        }).catch(function(e) {
			console.log(e.stack);
			res.json(400, {error: e.message});
		});
		// add to our player list
		try {
			players[data.room].push({'player': data.player, 'socket': this.id});
		}
		// or if room has just been created, add it to the players object
		catch (e) {
			players[data.room] = [];
			players[data.room].push({'player': data.player, 'socket': this.id});
		}

		game.in(data.room).emit('new player', players[data.room]);
		console.log(players);
	});

	socket.on('start request', function(data) {
		if (game.clients(data.room).length < 3) {
			socket.emit('start rejected');
		}
		else {
			game.in(data.room).emit('start');
		}
	});

	socket.on('emit player response', function(data) {
		console.log("IM HERE")
		console.log(data)
		var judge = find_judge_socket(data.room);
		console.log(socket[0])
		game.socket(players[data.room][0].socket).emit("player submission", data)
	})

	// remove player from list when they disconnect
	socket.on('disconnect', function() {
		console.log('PLAYER DISCONNECTED');

		// get the rooms the player has joined
		for (var room in players) {

			var p = find_player(players[room], socket.id);

			if (p === false) {
				console.log('could not find player in room');
				return;
			}

			else {
				players[room].splice(p, 1);
				console.log(players);
			}

		}
	});

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


