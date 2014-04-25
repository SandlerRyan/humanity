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
	//LOAD INITIAL 6 CARDS TO EVERY PLAYER IN THE GAME
	var tmpl = $('#tmpl-game-bottom-card').html();
	$("#cards-panel").html("");

	var compiledtmpl = _.template(tmpl, {
		white_cards: cards.white_cards
	});
	$("#cards-panel").html(compiledtmpl);
	$("#top-cards").show();
	loadjQuery();
});


/************************************************************
* IN GAME LOGIC
*************************************************************/

// Handler for player assignment on all turns but the first
socket.on('player assignment', function(cards) {
	console.log("IM A PLAYER NOW")
	//For players, show the new black card
	var tmpl = $('#tmpl-game-top-card').html();
	$("#black-card-panel").html("");

	var compiledtmpl = _.template(tmpl, {
		black_card: cards.black_card
	});

	$("#black-card-panel").html(compiledtmpl);

	//Assign the player specific panel and show the cards and append one card
	$("#cards-panel").show();

	var tmpl = $('#tmpl-game-single-card').html();

	var compiledtmpl = _.template(tmpl, {
		card: cards.white_card
	});
	$("#bottom-cards-container").append(compiledtmpl);
});

// JUDGE specific sockets.
socket.on('player submission', function(data) {
	
	var tmpl = $('#tmpl-game-single-card').html();

	var compiledtmpl = _.template(tmpl, {
		card: data.card
	});
	$("#submitted-cards").append(compiledtmpl);
	
	$('.useCard').unbind();
	loadJudgejQuery();

});

socket.on('judge assignment', function(card) {
	
	var tmpl = $('#tmpl-game-top-card').html();
	$("#black-card-panel").html("");
	var compiledtmpl = _.template(tmpl, {
		black_card: card.black_card
	});
	$("#black-card-panel").html(compiledtmpl);

	//Assign the judge specific panel and hide his cards 
	var tmpl = $('#tmpl-game-judge').html();
	$("#judge-panel").html("");
	var compiledtmpl = _.template(tmpl, {});
	$("#judge-panel").html(compiledtmpl);
	$("#cards-panel").hide();
	loadJudgeConfirmButton();
	
});

socket.on('winning card', function(card) {
	
	alert("The card " + card.card.content + " submitted by " + card.player.first)
	
	$("#confirmButton").unbind();
	$('#confirmButton').text("Confirm Submission")
	$('#confirmButton').removeAttr('disabled')
	console.log(card)
});

//Call this function to load jquery functions on game-related objects
function loadjQuery() {

	//Submit card
	$('#confirmButton').on('click', function() {
		console.log("CONFIRM BUTTON CLICKED")
		var card = $('.chosenCard').attr('id')
		if (card != "") {
			$(this).text("Waiting for Judge....")
			$(this).attr('disabled', 'disabled')
			var content = $('.chosenCard').children()[0].innerHTML;
			socket.emit('card submission',{'room': room, 'player': user, 'card': {'id': card, 'content': content}})
			$("#judge-panel").hide();

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

function loadJudgeConfirmButton() {

	//Submit card
	$('#confirmButton').on('click', function() {
		console.log("CONFIRM JUDGE BUTTON CLICKED")
		var card = $('.chosenCard').attr('id')
		if (card != "") {
			var content = $('.chosenCard').children()[0].innerHTML;
			socket.emit('judge submission',{'room': room, 'player': user, 'card': {'id': card, 'content': content}})
			socket.emit('begin turn', {'room': room})
		} else {
			alert("You must select a card first")
		}

	})
}

function loadJudgejQuery() {

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