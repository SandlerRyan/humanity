var socket = io.connect('http://localhost/lobby', {
	port: 3000,
	transports: ["websocket"],
	'sync disconnect on unload': true});

// tell the server a new player has joined
socket.on('connect', function() {
	console.log("client connected");
});




$('#create').on('click', function() {
	var user_id = $('#user_id');
	if(user_id.val() == '') {
		alert('Please enter a valid user id');
	}
	else {
		window.location.href = '/create/' + user_id.val()
	}
});

// Display New Games
$(document).ready(function () {
	var tmpl = $('#tmpl-games').html();

	

	socket.on('games', function (data) {
	// display the games in the table
		$("#show-games").html("");
		console.log(data)
		var compiledtmpl = _.template(tmpl, {games: data})
		$("#show-games").html(compiledtmpl);
	});
});