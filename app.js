/*********************************************
* Dependencies
*********************************************/

// Major dependencies
var express  = require('express');
var path = require('path');
var ex = require('./init/express');
var app = ex[0];
var passport = ex[1];

// route dependencies
var main = require('./routes/main');
var setup = require('./routes/setup');
var helpers = require('./helpers');


// Models
var Player = require('./models/Player');
var Game = require('./models/Game');
var GamePlayer = require('./models/GamePlayer');
var Turn = require('./models/Turn');
var BlackCard = require('./models/BlackCard');
var WhiteCard = require('./models/WhiteCard');


/*********************************************
* SERVER
*********************************************/
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
io.set('log level', 1);
app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'), 'localhost', function(){
  console.log('Express server listening on port ' + app.get('port'));
});


/*********************************************
* LOBBY SOCKET LOGIC
*********************************************/
// helper to decrease excess lines of code on promise errors
function errorHandler(e) {
	console.log(e.stack);
	res.json(400, {error: e.message});
}

var lobby = io.of('/lobby');

lobby.on('connection', function(socket) {

	//Send Initial Open Games
	Game.collection()
		.query('where', {active:1, started:0}).fetch()
		.then(function(games) {
			socket.emit('games', games);
		}).catch(function(e) {
			console.log(e.stack);
			res.json(400, {error: e.message});
		});

	//Keep sockets open and update every 5 seconds.
	setInterval(function() {
		Game.collection()
		.query('where', {active:1, started:0}).fetch()
		.then(function(games) {
			socket.emit('games', games);
		}).catch(errorHandler);
	}, 5000);
});
/*********************************************
* GAMEPLAY VARIABLES
*********************************************/
var gamecards = {}


/*********************************************
* GAME SOCKET LOGIC
*********************************************/

var game = io.of('/game');

game.on('connection', function(socket) {
	console.log('CONNECTED!!!');

	/**
	* Add a new player to db and notify all the other players
	*/
	socket.on('new player', function(data) {
		console.log('NEW USER JOINED!!!');
		// join the given room number
		this.join(data.room);

		// find the game and check if new player is the creator
		Game.find(data.room, {withRelated: ['players']}).then(function (model) {
			// tell the client side who the creator is so a start button can be rendered
			if (model.get('creator_id') == data.player.id) {
				game.emit('creator');
			}
			// add to our player list
			new GamePlayer({
				player_id: data.player.id,
				game_id: model.id
			}).fetch().then(function(player) {
				// add player to the game if they are completely new
				if (player == null)
				{
					new GamePlayer({
						player_id: data.player.id,
						game_id: model.id,
						socket_id: socket.id,
						connected: 1
					}).save().then(function(){
						var allplayers = model.related('players').push(player);
						game.in(data.room).emit('new player', allplayers.toJSON());
					}).catch(errorHandler);
				}
				// or udpate their info if they were previously in-game and disconnected
				else
				{
					player.set({socket_id: socket.id, connected: 1}).save()
					.then(function(){
						var allplayers = model.related('players').push(player);
						game.in(data.room).emit('new player', allplayers.toJSON());
					}).catch(errorHandler);
				}
			}).catch(errorHandler)
		}).catch(errorHandler);

	});

	/**
	* Handle player disconnects; different handling for pre-game and during game
	*/
	socket.on('disconnect', function() {
		console.log('PLAYER DISCONNECTED');

		new GamePlayer({socket_id: this.id}).fetch({withRelated:['game', 'player']})
		.then(function(model) {
			if (model == null) console.log('Disconnected player not found');
			else {
				// if game has already started, player is just marked disconnected
				// and can rejoin anytime
				if (model.related('game').get('started')) {
					model.set({connected: 0}).save().then(function() {
						socket.emit('player inactive');
					}).catch(errorHandler);
				}
				// if still in pre-game waiting phase, player is removed completely
				// to make room for other players trying to join the game
				else {
					model.destroy();
					socket.emit('player left');
				}
			}
		}).catch(errorHandler);
	});

	/**
	* Decide whether to officially start game when the game's creator
	* requests to do so
	*/
	socket.on('start request', function(data) {
		Game.find(data.room, {withRelated: 'players'}).then(function(model) {
			// verify that game has more than three people
			if (model.related('players').length < 1) {
				socket.emit('start rejected')
			}
			else {
				// notify clients that game has started and set game as started
				model.set({started: 1}).save().then(function(){
					gamecards[data.room] = main.get_all_cards();
					console.log(gamecards)
					game.in(data.room).emit('start');
				}).catch(errorHandler);
			}
		}).catch(errorHandler);
	});

	socket.on('player submitted card', function(data) {
		console.log("IM HERE")
		console.log(data)
		var judge = helpers.findJudgeSocket(data.room);

		game.in(data.room).emit('player submission', data);
		console.log(players[data.room][0].socket)
		//This sends a special emission to the first player to join the game
		//The first player, for now, is the judge of this round.
		game.socket(players[data.room][0].socket).emit("judge player submission", data)
	});
});


/*********************************************
* ROUTES
*********************************************/

// main routes for homepage, create/join game
app.get('/', main.homepage);
app.get('/lobby', main.lobby);
app.get('/game/:room', main.game);
app.get('/create', main.create);

var test = require('./routes/test');
app.get('/test', test.test1);

// facebook authentication routes
app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect : '/',
		failureRedirect : '/'
	}));
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});


