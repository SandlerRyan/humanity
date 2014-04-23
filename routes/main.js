var Player = require('../models/Player');
var Game = require('../models/Game');
var WhiteCard = require('../models/WhiteCard');
var BlackCard = require('../models/BlackCard');


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

	res.render('main/game', {room: req.params.room});
},

exports.lobby = function(req, res) {
	// require login to proceed
	if (req.user == undefined) {
		res.redirect('/');
	}
	res.render('main/lobby');
}
exports.get_all_cards = function() {


	data = {"white": [{"type": "white", "id": 1, "text": "this is a Test"},
	{"type": "white", "id": 2, "text": "this is a Test2"},
	{"type": "white", "id": 3, "text": "this is a Test3"}], "black": "This is a black card"}
	return data;

}
