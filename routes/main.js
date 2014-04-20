exports.homepage = function(req, res) {
	res.render('main/homepage', {title: 'Harvard Against Humanity' });
},


exports.game = function(req, res) {
	res.render('main/game', {room: req.params.room});
}

exports.lobby = function(req, res) {
	res.render('main/lobby');
}