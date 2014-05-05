/*********************************************
* DEPENDENCIES
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
	.query('where', {active:1, started:0})
	.fetch({withRelated:['players', 'creator']})
	.then(function(games) {
		socket.emit('games', games);
	}).catch(errorHandler);

	//Keep sockets open and update every 5 seconds.
	setInterval(function() {
		Game.collection()
		.query('where', {active:1, started:0}).fetch({withRelated:['players', 'creator']})
		.then(function(games) {
			socket.emit('games', games);
		}).catch(errorHandler);
	}, 5000);

});
/*********************************************
* GAMEPLAY VARIABLES
*********************************************/

/**
* Holds all the unused cards for each ongoing game
* KEYS: <socket room numbers>
* VALUES: {white: [<whitecard objects>], black: [<blackcard objects>]}
*/
var gamecards = {};

/**
* Holds all information about the state of the current
* turn in various games
* KEYS: <socket room numbers>
* VALUES: {
	judge: <judge socket id>,
	turn: <int>,
	submissions: <int>
	cards: (<whitecard object>, <player id>}
*/
var gamestates = {};

/**
* Sets the maximum number of turns before the game ends
*/
var TURN_LIMIT = 2;

/*********************************************
* GAME SOCKET LOGIC
*********************************************/

var game = io.of('/game');

game.on('connection', function (socket) {

	/**
	* Add a new player to db and notify all the other players
	*/
	socket.on('new player', function (data) {
		console.log('NEW USER JOINED!!!');
		// join the given room number
		this.join(data.room);

		// find the game and check if new player is the creator
		Game.find(data.room, {require: true, withRelated: ['players']})
		.bind({})
		.then(function (model) {
			this.game_model = model;
			// tell the client side who the creator is so a start button can be rendered
			if (this.game_model.get('creator_id') == data.player.id) {
				game.emit('creator');
			}
			// add to our player list
			return new GamePlayer({
				player_id: data.player.id,
				game_id: this.game_model.id
			}).fetch({require: true});

		// if players exists in db, they were previously in-game; update their info
		}).then(function (player) {
			socket.emit('reconnect', player);
			return player.set({socket_id: socket.id, connected: 1}).save();

		// if player is not in db, they were never in this game, so add them
		}).catch(function (e) {
			return new GamePlayer({
				player_id: data.player.id,
				game_id: this.game_model.id,
				socket_id: socket.id,
				connected: 1,
				judged: 0
			}).save();

		// alert existing players of the new player's arrival
		}).then(function () {
			return Player.find(data.player.id, {require: true});
		}).then(function (new_player) {
			var allplayers = this.game_model.related('players').push(new_player);
			game.in(data.room).emit('new player', allplayers.toJSON());
		}).catch(errorHandler);
	});

	/**
	* Handle player disconnects; different handling for pre-game and during game
	*/
	socket.on('disconnect', function () {
		console.log('PLAYER DISCONNECTED');

		new GamePlayer({socket_id: socket.id}).fetch({withRelated:['game.players', 'player']})
		.bind({})
		.then(function (model) {
			var room_num = model.related('game').get('id');
			// if game has already started, player is marked disconnected in db
			if (model.related('game').get('started')) {

				model.set({connected: 0}).save().then(function() {
					socket.emit('player left', {player: model.related('player')});
				});

				// if this is there are not enough players left, end the game
				if (model.related('game').related('players').length <= 3) {
					game.in(room_num).emit('end game', {
						message: 'There are no longer enough players in game--game ending'});

					Game.find(model.get('game_id')).then(function (game_model) {
						game_model.set({active: 0}).save();
					});
				}

				if (gamestates[room_num] != undefined) {
					// if the disconnected player was the judge, keep checking until all cards are
					// submitted, then pick a random player to emit their card as the winner
					if (gamestates[room_num]['judge'] ==  socket.id) {
						var submit_check = setInterval(function () {
							debugger;
							all_sockets = game.clients(room_num);

							if (gamestates[room_num]['submissions'] >= all_sockets.length) {
								rand_winner = all_sockets[Math.floor(Math.random() * all_sockets.length)];
								rand_winner.emit('judge left');
								clearInterval(submit_check);
								debugger;
							}
						}, 5000);
					}

					// if the last player with an unsubmitted card disconnects, then start judging phase
					if (gamestates[room_num]['submissions'] >= game.clients(room_num).length - 1) {
						game.clients(room_num).forEach(function (client) {
							if (client.id == gamestates[room_num]['judge']) {
								client.emit('begin judging');
							}
						});
					}
				}
			}
			// if still in pre-game waiting phase, player is removed completely
			// to make room for other players trying to join the game
			else {
				model.destroy();
				socket.emit('player left', {player: model.related('player')});

				// if this is the last active player, then delete the unstarted game
				if (model.related('game').related('players').length == 1) {
					model.related('game').destroy();
				}
			}
		}).catch(errorHandler);
	});

/*********************************************
* GAMEPLAY LOGIC
*********************************************/

	/**
	* Decide whether to officially start game when the game's creator
	* requests to do so
	*/
	socket.on('start request', function(data) {

		Game.find(data.room, {require: true, withRelated: 'players'}).bind({})
		.then(function (model) {
			this.model = model;

			// verify that game has more than three people
			if (model.related('players').length < 1) {
				socket.emit('start rejected')
			} else {
				// notify creator that game has started and set game as started
				socket.emit('start confirmed');
				model.set({started: 1}).save();

				// initialize keys for this game in the gameplay variables
				gamecards[data.room] = {};
				gamestates[data.room] = {
					'judge': null,
					'turn': 1,
					'submissions': 0
				};

				return helpers.getAllCards()
			}
		}).then(function (cards){
			gamecards[data.room] = cards;

			// Emit start event to all players, send them each 6 unique cards
			// The 7th card will be filled in by the begin turn event
			game.clients(data.room).forEach(function(client) {
				init_cards = [];
				for (i = 0; i < 6; i++) {
					init_cards.push(gamecards[data.room]['white'].pop());
				}

				// tell everyone the game is starting and send out a final player list
				client.emit('start', {
					'white_cards': init_cards,
					'players': this.model.related('players').toJSON()
				});
			}, this);
		}).catch(errorHandler);
	});

	/**
	* Start the turn (generic for all turns including the first)
	* 1. Figure out if game should continue or end
	* 2. Figure out which player should be the judge
	* 3. Pick a black card for everyone
	* 4. Notify the judge and send the black card
	* 5. Pick one new card for each player and send them the black card + new white card
	*/
	socket.on('begin turn', function(data) {

		// if we have reached the turn limit, end the game
		if (gamestates[data.room]['turn'] > TURN_LIMIT) {
			game.in(data.room).emit('end game', {
				message: 'Turn limit reached--game ending!'});
			Game.find(data.room).then(function (model) {
				model.set({active: 0}).save()
			}).catch(errorHandler);
		}
		// if there are not enough cards left, end the game
		else if (gamecards[data.room].length < game.clients(data.room).length) {
			game.in(data.room).emit('end game', {
				message: 'The deck is out of cards--game ending!'});
			Game.find(data.room).then(function (model) {
				model.set({active: 0}).save();
			}).catch(errorHandler);
		}
		else
		{
			// if the game continues, figure out who the judge should be
			judgeCallback = function (judge, players) {
				// select a blackcard
				black_card = gamecards[data.room]['black'].pop()

				// save judge socket id information in the global variable
				gamestates[data.room]['judge'] = judge.get('socket_id');

				// reset submission number to zero
				gamestates[data.room]['submissions'] = 0;

				// notify the new judge of his assignment, and notify all other players of their assignment
				game.clients(data.room).forEach(function (client) {
					if (client.id == judge.get('socket_id')) {
						client.emit('judge assignment', {
							'turn': gamestates[data.room]['turn'],
							'max_turns': TURN_LIMIT,
							'judge': judge.get('player_id'),
							'black_card': black_card
						});
					} else {
						client.emit('player assignment', {
							'turn': gamestates[data.room]['turn'],
							'max_turns': TURN_LIMIT,
							'judge': judge.get('player_id'),
							'black_card': black_card,
							'white_card': gamecards[data.room]['white'].pop()
						});
					}
				});
			}
			helpers.findJudgeSocket(data.room, judgeCallback);
		}
	});

	/**
	* When a player submits a card, relay this card to the other players and judge
	*/
	socket.on('card submission', function(data) {
		console.log("PLAYER SUBMITTED A CARD!");

		// log the submission in the gamestates array
		gamestates[data.room]['submissions'] += 1

		// notify the players and judges of the submission
		all_sockets = game.clients(data.room);
		all_sockets.forEach(function(client) {
			if (client.id == gamestates[data.room]['judge']) {
				client.emit('submission to judge', data);

				// if all cards have been submitted, begin judge phase
				if (gamestates[data.room]['submissions'] >= all_sockets.length - 1) {
					client.emit('begin judging');
				}
			}
			else {
				client.emit('submission to player', data);
			}
		});
	});

	/**
	* fired when the judge chooses a card, thus ending the turn
	*/
	socket.on('judge submission', function (data) {
		// save the turn data
		new Turn({
			game_id: data.room,
			number: gamestates[data.room]['turn'],
			black_card_id: data.black_card.id,
			white_card1_id: data.white_card.id,
			white_card2_id: null,
			winner_id: data.winner_id
		}).save().then(function () {
			// increment the turn counter
			gamestates[data.room]['turn'] += 1;
		}).catch(errorHandler);

		// get all the information for the winning player from db
		Player.find(data.winner_id).then(function (model) {
			data['player'] = model.toJSON();
			// winning card is submitted. Notify other players. Judge calls begin turn again
			game.clients(data.room).forEach(function(client) {
				if (client.id != gamestates[data.room]['judge']) {
					client.emit('winning card', data);
				}
			}, this);
		}).catch(errorHandler);
	});

	/**
	* handle the sending of chat messages
	*/
	socket.on('msg', function(data){

		// When the server receives a message, it sends it to the other person in the room.
		socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, player: data.player});
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


