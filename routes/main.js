var Player = require('../models/Player');
var Game = require('../models/Game');


exports.homepage = function(req, res) {
	res.render('main/homepage', {title: 'Harvard Against Humanity' });
},

exports.create = function(req,res) {
	Player.find(req.params.player_id)
	.then(function(player) {
		new Game({
			active: 1,
			started: 0,
			winner_id: null,
			creator_id: player.id
		})
		.save().then(function(model) {
			var url = '/game/' + model.id;
			res.redirect(url);
		}).catch(function(e) {
			console.log(e.stack);
			res.json(400, {error: e.message});
		});
	}).catch(function(e) {
		console.log(e.stack);
		res.json(400, {error: e.message});
	});
},

exports.game = function(req, res) {
	res.render('main/game', {room: req.params.room});
},

exports.lobby = function(req, res) {
	res.render('main/lobby');
}