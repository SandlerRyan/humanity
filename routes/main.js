var Player = require('../models/Player');
var Game = require('../models/Game');
var WhiteCard = require('../models/WhiteCard');
var BlackCard = require('../models/BlackCard');



// HELPER FUNCTION
function playerInGame(id, players) {
	ingame = false;
	players.forEach(function (player) {
		if (player.get('id') == id) {
			ingame = true;
		}
	}, this);
	return ingame;
}

// The main page of the app
exports.homepage = function(req, res) {
	res.render('homepage', {
		title: 'Harvard Against Humanity',
		messages: req.flash('filter')
	});
},

// creates a new game and adds it to the db
exports.create = function(req,res) {
	// require login to proceed
	if (req.user == undefined) {
		req.flash('filter', 'You must be logged in to create a game');
		res.redirect('/');
	}

	new Game({
		active: 1,
		started: 0,
		winner_id: null,
		creator_id: req.user.id
	})
	.save().then(function(model) {
		var url = '/game/' + model.id;
		res.redirect(url);
	}).catch(function(e) {
		res.json(400, {error: e.message});
	});
},

// renders the game
exports.game = function(req, res) {
	// require login to proceed
	if (req.user == undefined) {
		req.flash('filter', 'You must be logged in to access games');
		res.redirect('/');
	}
	new Game({
		id: req.params.room,
		active: 1
	 }).fetch({require: true, withRelated: 'players'})
	.then(function (model) {
		// verify that game has not started yet
		if (model.get('started') == 1) {
			req.flash('filter', 'The requested game has already started.');
			res.redirect('/lobby');
		}
		// check that there's not more than 8 players
		if (model.related('players').length >= 8) {
			req.flash('filter', 'The requested game has too many players.');
			res.redirect('/lobby');
		}
		// check if the player has already joined the game
		if (playerInGame(req.user.id, model.related('players'))) {
			req.flash('filter', 'You are already in this game.');
			res.redirect('/lobby');
		}

		// let the user in if all filter are passed
		res.render('main/game', {room: req.params.room});
	}).catch(function (e) {
		req.flash('filter', 'The requested game could not be found.');
		res.redirect('/lobby');
	});
},

// renders the view for the lobby
exports.lobby = function(req, res) {
	// require login to proceed
	if (req.user == undefined) {
		req.flash('filter', 'You must be logged in to access the game lobby');
		res.redirect('/');
	}
	res.render('main/lobby', {messages: req.flash('filter')});
}
