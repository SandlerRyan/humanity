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
		.query('where', {active:1, started:0}).fetch({withRelated:['players', 'creator']})
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
						connected: 1,
						judged: 0
					}).save().then(function(){}).catch(errorHandler);
				}
				// or udpate their info if they were previously in-game and disconnected
				else
				{
					player.set({socket_id: socket.id, connected: 1}).save()
					.then(function(){}).catch(errorHandler);
				}
			}).catch(errorHandler)

			Player.find(data.player.id).then(function(new_player) {
				var allplayers = model.related('players').push(new_player);
				game.in(data.room).emit('new player', allplayers.toJSON());
			}).catch(errorHandler);

		}).catch(errorHandler);
	});

	/**
	* Handle player disconnects; different handling for pre-game and during game
	*/
	socket.on('disconnect', function() {
		console.log('PLAYER DISCONNECTED');

		new GamePlayer({socket_id: this.id}).fetch({withRelated:['game.players', 'player']})
		.then(function(model) {
			// if game has already started, player is just marked disconnected
			// and can rejoin anytime
			if (model.related('game').get('started')) {
				model.set({connected: 0}).save().then(function() {
					socket.emit('player inactive');
				}).catch(errorHandler);

				// if this is the last active player, then inactivate game
				if (model.related('game').related('players').models.length == 1) {
					model.related('game').set({active: 0}).save()
					.then(function() {}).catch(errorHandler);
				}
			}
			// if still in pre-game waiting phase, player is removed completely
			// to make room for other players trying to join the game
			else {
				model.destroy();
				socket.emit('player left');

				// if this is the last active player, then delete the unstarted game
				if (model.related('game').related('players').models.length == 1) {
					model.related('game').destroy();
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
				model.set({started: 1}).save().then(function(){}).catch(errorHandler);

				helpers.getAllCards(function(cards){
					// Confirm start to the creator so they can fire the first turn
					socket.emit('start confirmed');
					gamecards[data.room] = cards;
					// Emit start event to all players, send them each 6 unique cards
					// The 7th card will be filled in by the begin turn event
					all_sockets = game.clients(data.room);
					all_sockets.forEach(function(client) {
						init_cards = []
						for (i = 0; i < 6; i++) {
							init_cards.push(gamecards[data.room]['white'].pop());
						}
						client.emit('start', {'white_cards': init_cards});
					});
				});
			}
		}).catch(errorHandler);
	});

	/**
	* Start the turn (generic for all turns including the first)
	* 1. Figure out which player should be the judge
	* 2. Pick a black card for everyone
	* 3. Notify the judge and send the black card
	* 4. Pick one new card for each player and send them the black card + new white card
	*/
	socket.on('begin turn', function(data) {
		helpers.findJudgeSocket(data.room, function(judge, players) {
			// select a blackcard
			console.log("JUDGE FOR THIS ROUND IS ")
			console.log(judge)
			black_card = gamecards[data.room]['black'].pop()

			//save judge socket id information in the global variable
			gamecards[data.room]['judge'] = judge.get('socket_id')
			// notify the new judge of his assignment, and notify all other players of their assignment
			all_sockets = game.clients(data.room);
			all_sockets.forEach(function(client) {
				if (client.id == judge.get('socket_id')) {
					client.emit('judge assignment', {'black_card': black_card});
				}
				else {
					client.emit('player assignment', {
						'black_card': black_card,
						'white_card': gamecards[data.room]['white'].pop()
					});
				}
			});
		});
	});

	// When a player submits a card for the judge, this socket is fired.
	socket.on('card submission', function(data) {
		console.log("PLAYER SUBMITTED A CARD!")
		console.log(gamecards[data.room]['judge'])
		// socket.emit(gamecards[data.room]['judge'])
		all_sockets = game.clients(data.room);
		all_sockets.forEach(function(client) {
			if (client.id == gamecards[data.room]['judge']) {
				client.emit('player submission', data);
			}
			else {
				client.emit('player submission player', data);
			}
		})

	});

	// fired when the judge chooses a card, thus ending the turn
	socket.on('judge submission', function(data){
		
		// save the turn data
		var t = new Turn({
			game_id: data.room,
			number: gamecards[data.room]['turn'],
			black_card_id: data.black_card.id,
			white_card1_id: data.white_card.id,
			white_card2_id: null,
			winner_id: data.player.id
		}).save().then(function (){
			// increment the turn counter
			gamecards[data.room]['turn'] += 1;
		}).catch(errorHandler);

		//Winning card is submitted. Notify other players. And then call Begin Turn again.
		socket.broadcast.to(data.room).emit('winning card', data);
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


