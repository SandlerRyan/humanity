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
	$('#start').html('<button type=button class="btn btn-lg btn-primary" style="margin-bottom:20px"  id="start-button">Start Game!</button>');
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
	//LOAD INITIAL 6 CARDS TO EVERY PLAYER IN THE GAME
	var tmpl = $('#tmpl-game-bottom-card').html();
	$("#cards-panel").html("");

	var compiledtmpl = _.template(tmpl, {
		white_cards: cards.white_cards
	});
	$("#cards-panel").html(compiledtmpl);
	$("#top-cards").show();
	bindPlayerButton();
	bindPlayerPanel();
});


/************************************************************
* IN GAME LOGIC
*************************************************************/

// Handler for player assignment on all turns but the first
socket.on('player assignment', function(cards) {
	console.log('player');
	loadTopPanel(cards);
	bindPlayerButton();

	$('#judge-panel').hide();
	$("#cards-panel").show();


	var tmpl = $('#tmpl-game-single-card').html();
	var compiledtmpl = _.template(tmpl, {
		card: cards.white_card
	});
	$("#bottom-cards-container").append(compiledtmpl);

	//initialize the submitted-panel
	var tmpl = $('#tmpl-game-player-sub').html();
	$("#submitted-panel").html("");
	var compiledtmpl = _.template(tmpl, {});

	$("#submitted-panel").html(compiledtmpl);
	$("#submitted-panel").hide();

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
	$("#judge-panel").html(compiledtmpl);
	$("#judge-panel").show();

	// bind new jquery event handlers
	bindJudgePanel();
	bindJudgeButton();
});

socket.on('player submission', function(data) {

	console.log('SUBMISSION: ' + data);
	var tmpl = $('#tmpl-game-single-card').html();
	var compiledtmpl = _.template(tmpl, {
		card: data.card
	});
	$("#submitted-cards").append(compiledtmpl);

	bindJudgePanel();

});


socket.on('player submission player', function(data) {

	//add submitted card to submitted panel
	var tmpl = $('#tmpl-game-blank-card').html();
	var compiledtmpl = _.template(tmpl, {
		card: data.card
	});
	$("#submitted-cards").append(compiledtmpl);

});


socket.on('winning card', function(card) {
	alert("The card " + card.card.content + " submitted by " +
		card.player.first + " is the winnner!");
});

function loadTopPanel(cards) {
	var tmpl = $('#tmpl-game-top-card').html();
	$("#black-card-panel").html("");
	var compiledtmpl = _.template(tmpl, {
		black_card: cards.black_card
	});
	$("#black-card-panel").html(compiledtmpl);

	// blank out the 'chosen' white card div
	$('.chosenCard').removeAttr('id');
	$('.chosenCard').children()[0].innerHTML = '';
}


function bindPlayerButton() {
	// unbind previous handlers attached when user was a judge
	// or when user submitted the last card
	$('#confirmButton').unbind('click');
	$('#confirmButton').removeAttr('disabled');
	$('#confirmButton').text("Confirm Submission");

	$('#confirmButton').on('click', function() {
		var card = $('.chosenCard').attr('id')
		if (card != "") {
			$(this).text("Waiting for Judge....")
			$(this).attr('disabled', 'disabled')
			var content = $('.chosenCard').children()[0].innerHTML;
			socket.emit('card submission',{'room': room, 'player': user, 'card': {'id': card, 'content': content}})
			
			$("#cards-panel").hide();
			$("#submitted-panel").show();

		} else {
			alert("You must select a card first")
		}

	});
}

function bindPlayerPanel() {
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

function bindJudgeButton() {
	// unbind previous handlers attached when user was a player
	$('#confirmButton').unbind('click');
	$('#confirmButton').removeAttr('disabled');
	$('#confirmButton').text("Confirm Submission");

	$('#confirmButton').on('click', function() {
		console.log("CONFIRM JUDGE BUTTON CLICKED")
		var card = $('.chosenCard').attr('id')
		if (card != "") {
			var content = $('.chosenCard').children()[0].innerHTML;
			// notify players of the choice through the server
			socket.emit('judge submission',{'room': room, 'player': user, 'card': {'id': card, 'content': content}});
			// tell server to start next turn
			socket.emit('begin turn', {'room': room});
			$('#judge-panel').hide();
			$("#cards-panel").show();
		} else {
			alert("You must select a card first")
		}

	})
}

function bindJudgePanel() {

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