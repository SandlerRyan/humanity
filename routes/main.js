var Player = require('../models/Player');
var Game = require('../models/Game');


exports.homepage = function(req, res) {
<<<<<<< HEAD
	if (req.user == undefined){
		has_user = 0;
	}
	else{
		has_user = 1;
	}
	res.render('homepage', {title: 'Harvard Against Humanity', has_user: has_user});
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
	data = [{"type": "white", "id": 1, "text": "this is a Test"},
	{"type": "white", "id": 2, "text": "this is a Test2"},
	{"type": "white", "id": 3, "text": "this is a Test3"}]
	res.render('main/game', {room: req.params.room, white_cards: data });
},

exports.lobby = function(req, res) {
	var data = [{id: 1}, {id: 2}, {id:3}]
	res.render('main/lobby', {rooms: data});
}