var Player = require('../models/Player');

exports.homepage = function(req, res) {
	res.render('main/homepage', {title: 'Harvard Against Humanity' });
},

exports.create=function(req,res) {
	var player = Player.find(req.params.player_id);

}

exports.game = function(req, res) {
	res.render('main/game', {room: req.params.room});
}

exports.lobby = function(req, res) {
	res.render('main/lobby');
}