/************************************************************
* EXTERNAL VARIABLES PASSED INTO THIS FILE
* user- the user object from session, passed into every template
* by some custom middleware and passed by ejs into the script
*
* room- the socket room this game takes place in (equal to the
* game id in db and also listed in the url of the game)
*************************************************************/


/************************************************************
* UNDERSCORE TEMPLATE SETTINGS
*************************************************************/

_.templateSettings = {
		evaluate: /\{\[([\s\S]+?)\]\}/g,
   		interpolate: /\{\{([\s\S]+?)\}\}/g,
   		escape: /\{\{-([\s\S]+?)\}\}/g
	};

/************************************************************
* LOGIC FOR WAITING FOR START OF GAME
*************************************************************/
var socket = io.connect('http://localhost/game', {
	port: 3000,
	transports: ["websocket"],
	'sync disconnect on unload': true});

// tell the server a new player has joined
socket.on('connect', function() {
	// Figure out which Room the new user should be in
	socket.emit('new player', {'room': room, 'player': user});
});

/* when a new player joins, socket emits the new player to existing players
* and a list of existing players to the new player */
socket.on('new player', function(players) {
	console.log('NEW PLAYER!!!');
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

// if this player is the game creator, render a button for them to start the game
socket.on('creator', function() {
	$('#start').html('<button type=button class="btn btn-lg btn-primary" style="margin-bottom:20px"  id="start-button">Start Game!</button>');
	$('#start-button').on('click', function() {
		socket.emit('start request', {'room': room});
	});
});

// emitted to game creator if not enough people have joined to start the game
socket.on('start rejected', function() {
	alert('You must have at least three players to start a game');
});

// emitted to game creator upon successful game start
socket.on('start confirmed', function() {
	socket.emit('begin turn', {'room': room});
});

// emitted to all players
socket.on('start', function(cards) {

	alert('GAME STARTING!!!');
	$('#show-players').hide();
	$('#start-button').hide();

	// handling for first term; this event is handled
	// differently in subsequent turns
	//LOAD INITIAL 6 CARDS TO EVERY PLAYER IN THE GAME
	var tmpl = $('#tmpl-game-bottom-card').html();
	$("#cards-panel").html("");

	var compiledtmpl = _.template(tmpl, {
		white_cards: cards.white_cards
	});
	$("#cards-panel").html(compiledtmpl);
	$("#top-cards").show();
});


/************************************************************
* IN GAME LOGIC
*************************************************************/

// Handler for player assignment on all turns but the first
socket.on('player assignment', function(cards) {
	console.log('player');
	loadTopPanel(cards);

	$('#judge-panel').hide();
	$("#cards-panel").show();

	var tmpl = $('#tmpl-game-single-card').html();
	var compiledtmpl = _.template(tmpl, {
		card: cards.white_card
	});
	$("#bottom-cards-container").append(compiledtmpl);

	// compile submitted panel template and bind jquery handlers
	var tmpl = $('#tmpl-game-player-sub').html();
	$("#submitted-panel").html("");
	var compiledtmpl = _.template(tmpl, {});
	$("#submitted-panel").html(compiledtmpl);


	// set a timer for the player
	var time = 20;
	var player_timer = setTimeout(function () {
		console.log('TIME EXPIRED');

		$('#confirmButton').text('Waiting for Judge...').attr('disabled', 'disabled');
		socket.emit('card submission', {
			'room': room,
			'player': user,
			'card': {'id': null, 'content': null}
		});

	}, time * 1000);

	bindPlayerPanel();
	bindPlayerButton(player_timer);

	// display a timer on the webpage
	(function countDown(){
		if (time-->0) {
			if( $('#confirmButton').attr('disabled')) {
				$('#t').text(time + ' s');
			} else {
				$('#t').text(time + ' s');
				setTimeout(countDown, 1000);
			}
		} else {
			$('#t').text('Time is up!');
		}
	}) ();
});

// JUDGE specific sockets.
socket.on('judge assignment', function(cards) {
	console.log('judge');
	loadTopPanel(cards);

	//Assign the judge specific panel and hide his cards
	var tmpl = $('#tmpl-game-judge').html();
	$("#judge-panel").html("");
	var compiledtmpl = _.template(tmpl, {});

	$("#cards-panel").hide();
	$("#submitted-panel").hide();
	$("#judge-panel").html(compiledtmpl);
	$("#judge-panel").show();

	// bind new jquery event handlers
	bindJudgePanel();
	bindJudgeButton();
});

socket.on('begin judging', function () {
	alert('You may now choose the best card');
	$('#confirmButton').text("Confirm submission")
	$('#confirmButton').removeAttr('disabled');
});

socket.on('submission to judge', function(data) {

	console.log('SUBMISSION: ' + data);
	if (data.card.id != null) {
		var tmpl = $('#tmpl-game-single-card').html();
		var compiledtmpl = _.template(tmpl, {
			card: data.card
		});
		$("#submitted-cards").append(compiledtmpl);

		bindJudgePanel();
	}

});

socket.on('submission to player', function(data) {

	//add submitted card to submitted panel
	var tmpl = $('#tmpl-game-blank-card').html();
	var compiledtmpl = _.template(tmpl, {
		card: data.card
	});
	$("#sub-cards").append(compiledtmpl);

	bindPlayerPanel();

});


socket.on('winning card', function(card) {
	alert("The card " + card.white_card.content + " submitted by " +
		card.player.first + " is the winnner!");
});


