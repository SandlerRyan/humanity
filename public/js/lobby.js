var socket = io.connect('http://localhost/lobby', {
	port: 3000,
	transports: ["websocket"],
	'sync disconnect on unload': true});

// tell the server a new player has joined
socket.on('connect', function() {
	console.log("client connected");
});


//When a new game is created
socket.on('games', function (data) {
	// display the games in the table
	var tmpl = $('#tmpl-games').html();
	$("#show-games").html("");

	_.templateSettings = {
		evaluate: /\{\[([\s\S]+?)\]\}/g,
   		interpolate: /\{\{([\s\S]+?)\}\}/g,
   		escape: /\{\{-([\s\S]+?)\}\}/g
	};

	var compiledtmpl = _.template(tmpl, {games: data})
	$("#show-games").html(compiledtmpl);
});
