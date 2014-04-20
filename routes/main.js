exports.homepage = function(req, res) {
	res.render('main/homepage', {title: 'Harvard Against Humanity' });
},


exports.lobby = function(req, res) {
	res.render('main/lobby', {room: req.params.room});
}

exports.gamelist = function(req, res) {
	res.render('main/gamelist');
}