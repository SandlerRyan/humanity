/************************************************************
* LOGIC FOR WAITING FOR START OF GAME
*************************************************************/
var socket = io.connect('http://localhost/game', {
	port: 3000,
	transports: ["websocket"],
	'sync disconnect on unload': true});

// tell the server a new player has joined
socket.on('connect', function() {
	console.log("client connected");

	// Figure out which Room the new user should be in
	socket.emit('new player', {'room': room, 'player': user});
});

/* when a new player joins, socket emits the new player to existing players
* and a list of existing players to the new player */
socket.on('new player', function(players) {
	console.log('player list');
	console.log(players);

	//Re-render underscore template with new player that joined
	var tmpl = $('#tmpl-players').html();
	$("#show-players").html("");

	_.templateSettings = {
		evaluate: /\{\[([\s\S]+?)\]\}/g,
   		interpolate: /\{\{([\s\S]+?)\}\}/g,
   		escape: /\{\{-([\s\S]+?)\}\}/g
	};
	var compiledtmpl = _.template(tmpl, {players: players})
	$("#show-players").html(compiledtmpl);
});

socket.on('creator', function() {
	console.log('CREATOR');
	$('#start').html('<button type=button class="btn btn-lg btn-primary btn-block" style="margin:10px"  id="start-button">Start Game!</button>');
	$('#start-button').on('click', function() {
		socket.emit('start request', {'room': room});
	});
});

socket.on('start rejected', function() {
	alert('You must have at least three players to start a game');
});

socket.on('start confirmed', function() {
	socket.emit('begin turn', {'room': room});
});

socket.on('start', function(cards) {
	alert('GAME STARTING!!!');
	console.log('GAME STARTING!!!');
	$('#show-players').hide();
	$('#start-button').hide();

	// handling for first term; this event is handled
	// differently in subsequent turns
	socket.on('player assignment', function(newcards){
		//Compile the game template
		var tmpl = $('#tmpl-game-players').html();
		$("#show-game").html("");

		_.templateSettings = {
			evaluate: /\{\[([\s\S]+?)\]\}/g,
	   		interpolate: /\{\{([\s\S]+?)\}\}/g,
	   		escape: /\{\{-([\s\S]+?)\}\}/g
		};

		var compiledtmpl = _.template(tmpl, {
			white_cards: cards.white.push(newcards.white_card),
			black_card: newcards.black_card
		});

		$("#show-game").html(compiledtmpl);
		loadjQuery();
	});
});


/************************************************************
* IN GAME LOGIC
*************************************************************/

// Handler for player assignment on all turns but the first
socket.on('player assignment', function(data) {
	console.log(data)
});

// JUDGE specific sockets.
socket.on('player submission', function(data) {
	console.log(data)
});

socket.on('judge assignment', function(data) {
	console.log(data)
});


//Call this function to load jquery functions on game-related objects
function loadjQuery() {

	//Submit card
	$('#confirmButton').on('click', function() {
		var card = $('.chosenCard').attr('id')
		if (card != "") {
			$(this).text("Waiting for Judge....")
			$(this).attr('disabled', 'disabled')
			socket.emit('card submission',{'room': room, 'player': user, 'card': card} )
		} else {
			alert("You must select a card first")
		}

	})

	//Toggle between chosen card
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
}
