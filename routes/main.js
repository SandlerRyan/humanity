exports.homepage = function(req, res) {
	res.render('main/homepage', {title: 'Harvard Against Humanity' });
},


exports.lobby = function(req, res) {
	res.render('main/lobby');

	// io.sockets.on('connection', function(socket) {
	// 	console.log('connected to lobby');
	// 	socket.on('user', function(data) {
	// 		console.log("JOINED THIS SPECIFIC ROOM");
	// 		// socket.join(room);
	// 	});
	// });

	// return function(req, res) {
	// 		res.render('main/lobby');
	// }
}