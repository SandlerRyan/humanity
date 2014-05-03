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
	'sync disconnect on unload': true
});

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
socket.on('start', function(data) {

	alert('GAME STARTING!!!');
	$('#show-players').hide();
	$('#start-button').hide();

	// load initial six cards for every player in the game
	var tmpl = $('#tmpl-game-bottom-card').html();
	$("#cards-panel").html("");
	var compiledtmpl = _.template(tmpl, {
		white_cards: data.white_cards
	});
	$("#cards-panel").html(compiledtmpl);
	$("#top-cards").show();

	// load the table showing each player's score; bind chat jquery
	var score_tmpl = $('#tmpl-game-scores').html();
	$('#score-panel').html('');
	$('#score-panel').html( _.template(score_tmpl, {players: data.players}));
	bindChatButton();

});


/************************************************************
* IN GAME LOGIC
*************************************************************/

// Handler for player assignment on all turns but the first
socket.on('player assignment', function(data) {
	console.log('player');
	loadTopPanel(data);

	// display the player's hand of cards
	$('#judge-panel').hide();
	$("#cards-panel").show();

	// append the newly received card
	var tmpl = $('#tmpl-game-single-card').html();
	var compiledtmpl = _.template(tmpl, {
		card: data.white_card
	});
	$("#bottom-cards-container").append(compiledtmpl);

	// compile submitted panel template and bind jquery handlers
	var tmpl = $('#tmpl-game-player-sub').html();
	$("#submitted-panel").html("");
	var compiledtmpl = _.template(tmpl, {});
	$("#submitted-panel").html(compiledtmpl);

	// reset the player's submission status on the scoreboard and reveal the judge
	resetAllSubmitted();
	markJudge(data.judge);

	// set a timer for the player
	var time = 200;
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

	// display the timer on the webpage
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
socket.on('judge assignment', function(data) {
	console.log('judge');
	loadTopPanel(data);

	// Assign the judge specific panel and hide his cards
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

	// reset the player's submission status on the scoreboard mark self as judge
	resetAllSubmitted();
	markJudge(data.judge);
});

socket.on('begin judging', function () {
	alert('You may now choose the best card');
	$('#confirmButton').text("Confirm submission")
	$('#confirmButton').removeAttr('disabled');

	var time = 100;
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

			//Choose a random submitted card and declare it as the winner when the time is up
			$('#t').text('Time is up!');

			//If there are no submitted cards, end the game. Fuck it.
			if($("#submitted-cards > .useCard").first().length == 0) {
				socket.emit('tear down this game')
			} else {

				var randomCard = $("#submitted-cards > .useCard").first().attr('id');
				var content = $("#submitted-cards > .useCard").first().children()[0].innerHTML;
				var black_card = $('.black');

				//Send back random judge submission
				socket.emit('judge submission', {
					'room': room,
					'player': user,
					'white_card': {'id': randomCard, 'content': content},
					'black_card': {'id': black_card.attr('id')}
				});
				// tell server to start next turn
				socket.emit('begin turn', {'room': room});
				$('#judge-panel').hide();
				$("#cards-panel").show();
			}

		}
	}) ();

});

socket.on('submission to judge', function(data) {

	// card id will be null if player didn't submit and time limit simply expired
	if (data.card.id != null) {
		//
		var tmpl = $('#tmpl-game-single-card').html();
		var compiledtmpl = _.template(tmpl, {
			card: data.card
		});
		$("#submitted-cards").append(compiledtmpl);

		// bind jquery event handlers
		bindJudgePanel();

		// mark player as submitted
		markSubmitted(data.player.id);
	}

});

socket.on('submission to player', function(data) {

	// add submitted card to submitted panel
	var tmpl = $('#tmpl-game-blank-card').html();
	var compiledtmpl = _.template(tmpl, {
		card: data.card
	});
	$("#sub-cards").append(compiledtmpl);

	// bind jquery event handlers
	bindPlayerPanel();

	// mark player as submitted
	markSubmitted(data.player.id);

});

socket.on('winning card', function(data) {
	// update the player's score
	updateScore(data.player.id);

	console.log("WINNING CARD IS ")
	console.log(card)

	$("#" + card.white_card.id).removeClass('selected').removeClass('white').addClass('winner')

	// alert("The card " + card.white_card.content + " submitted by " +
	// 	card.player.first + " is the winnner!");


});

//logic for chat
socket.on('receive', function(data){

	createChatMessage(data.msg, data.player);

});

