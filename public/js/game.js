// get the room id from the GET params
function get_room () {
	var url = document.URL.split['/'];
	return url[url.length - 1];
}

// start socket connection when user name is entered
$('#submit').on('click', function() {
	var user_id = $('#user_id');
	if (user_id.val() == '') {
		alert('Please enter a valid user id');
	}

	else
	{
		var socket = io.connect('http://localhost/game/', {
			port: 3000,
			transports: ["websocket"],
			'sync disconnect on unload': true});

		socket.on('connect', function() {
			console.log("client connected");

			// Figure out which Room the new user should be in
			socket.emit('new player', {'room': get_room(), 'player_id': user_id.val()});
		});


		// when a new player joins, socket emits the new player to existing players
		// and a list of existing players to the new player
		socket.on('new player', function(players) {
			console.log(players);
		});

	}
});
