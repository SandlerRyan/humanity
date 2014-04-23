var Player = require('../models/Player');
var Game = require('../models/Game');
var WhiteCard = require('../models/WhiteCard');
var BlackCard = require('../models/BlackCard');



//HELPER FUNCTION
function errorHandler(e) {
	console.log(e.stack);
	res.json(400, {error: e.message});
}

function inArray(id, arr) {
	for(var i = 0; i < arr.length; i++) {
		if (arr[i].id == id) {
			return true;
		}
	}
	return false;
}

exports.homepage = function(req, res) {
	res.render('homepage', {title: 'Harvard Against Humanity'});
},

exports.create = function(req,res) {
	// require login to proceed
	if (req.user == undefined) {
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
		console.log(e.stack);
		res.json(400, {error: e.message});
	});
},

exports.game = function(req, res) {
	// require login to proceed
	if (req.user == undefined) {
		res.redirect('/');
	}
	Game.find(req.params.room, {withRelated: 'players'}).then(function (model) {
		// verify that game has not started yet
		if (model.get('started') == 1) {
			// if user was previously in game, they can rejoin; otherwise
			// no access
			if (!inArray(req.user.id, model.related('players'))){
				res.redirect('/lobby');
			}
		}
		// check that there's not more than 8 players
		if (model.related('players').length >= 8) {
			res.redirect('/lobby');
		}
		res.render('main/game', {room: req.params.room});
	}).catch(errorHandler);
},

exports.lobby = function(req, res) {
	// require login to proceed
	if (req.user == undefined) {
		res.redirect('/');
	}
	res.render('main/lobby');
},

exports.get_all_cards = function(callback) {
	
	var data = {}
	WhiteCard.collection().fetch().then(function(collection) {
		data['white'] = collection.toJSON();
		BlackCard.collection().fetch().then(function(collection) {
			data['black'] = collection.toJSON();

			callback(data);
		}).catch(errorHandler);
	}).catch(errorHandler);
}
