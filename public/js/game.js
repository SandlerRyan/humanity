var socket = io.connect('http://localhost/game', {
			port: 3000,
			transports: ["websocket"],
			'sync disconnect on unload': true});


// get the room id from the GET params
function get_room () {
	// var url = document.URL.split['/'];
	// return url[url.length - 1];

	return 1;
}

// start socket connection when user name is entered
// $('#submit').on('click', function() {
// 	var user_id = $('#user_id');
// 	if (user_id.val() == '') {
// 		alert('Please enter a valid user id');
// 	}

// 	else
// 	{
		

// 	}
// });

$( document ).ready(function() {
    
	socket.on('connect', function() {
		console.log("client connected");

		// Figure out which Room the new user should be in
		socket.emit('new player', {'room': get_room(), 'player_id': 1});
	});

	// when a new player joins, socket emits the new player to existing players
	// and a list of existing players to the new player
	socket.on('new player', function(players) {
		console.log(players);
	});

	// JUDGE specific sockets. 
	socket.on('player submission', function(data) {
		console.log(data)
	})


	$('#confirmButton').on('click', function() {
		console.log("clicked")
		var card = $('.chosenCard').attr('id')
		console.log(card)
		if (card != "") {
			$(this).text("Waiting for Judge....")
			$(this).attr('disabled', 'disabled')
			socket.emit('emit player response', {'player': 1, 'card': card, 'room': get_room()})
		} else {
			alert("You must select a card first")
		}
 		
	})


	$('.useCard').on('click', function() {
		console.log($(this).children().first().children()[0].innerHTML)
		var card = $(this);
		var cardID =  $(this).attr('id')
		var cardText = $(this).children().first().children()[0].innerHTML
		$('.chosenCard').attr('id', cardID);
		$('.chosenCard').children()[0].innerHTML = cardText;
		$(this).removeClass('white')
		//remove all selected tags.
		$(".selected").switchClass("selected", "white");
		$(this).addClass('selected')
	})
});
