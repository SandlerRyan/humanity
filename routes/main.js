exports.homepage = function(req, res) {
	
	data = [{"type": "white", "id": 1, "text": "this is a Test"}, 
	{"type": "white", "id": 2, "text": "this is a Test2"},
	{"type": "white", "id": 3, "text": "this is a Test3"}]
	res.render('game', {title: 'Harvard Against Humanity', white_cards: data });
},


exports.game = function(req, res) {
	res.render('main/game', {room: req.params.room});
}

exports.lobby = function(req, res) {
	res.render('main/lobby');
}