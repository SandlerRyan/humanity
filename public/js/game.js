/************************************************************
* LOGIC FOR WAITING FOR START OF GAME
*************************************************************/
var socket = io.connect('http://localhost/game', {
	port: 3000,
	transports: ["websocket"],
	'sync disconnect on unload': true});

// get the room id from the GET params
function get_room () {
	var url = document.URL.split('/');
	return url[url.length - 1];
}

// tell the server a new player has joined
socket.on('connect', function() {
	console.log("client connected");

	// Figure out which Room the new user should be in
	socket.emit('new player', {'room': get_room(), 'player': $('#player').text()});
});

/* when a new player joins, socket emits the new player to existing players
* and a list of existing players to the new player */
socket.on('new player', function(players) {
	console.log('player list');
	console.log(players);
});

socket.on('creator', function() {
	console.log('CREATOR');
	$('#start').html('<button type=button id="start-button">Start Game!</button>');
	$('#start-button').on('click', function() {
		socket.emit('start request', {'room': get_room()});
	});
});

socket.on('start rejected', function() {
	alert('You must have at least three players to start a game');
});

socket.on('start', function() {
	alert('GAME STARTING!!!');
	$('#waiting-header').remove();
	$('#waiting-list').remove();
	$('start-button').remove();
	$('.card-pane').show();
	$('#judge-heading').show();
});


/************************************************************
* IN GAME LOGIC
*************************************************************/

$( document ).ready(function() {

	// JUDGE specific sockets.
	socket.on('player submission', function(data) {
		console.log(data)
	})


	$('#confirmButton').on('click', function() {
		var card = $('.chosenCard').attr('id')
		if (card != "") {
			$(this).text("Waiting for Judge....")
			$(this).attr('disabled', 'disabled')
		} else {
			alert("You must select a card first")
		}

	})

	//When a
	$('.useCard').on('click', function() {
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
