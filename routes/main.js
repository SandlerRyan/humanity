exports.homepage = function(req, res) {
	res.render('main/homepage', {title: 'Harvard Against Humanity' });
},

exports.lobby = function(io) {

	io.sockets.on('connection', function(socket) {
		console.log('connected to lobby');
	});

	return function(req, res) {
			res.render('main/lobby');
	}

}