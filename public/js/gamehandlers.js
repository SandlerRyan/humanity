 /**************************************************************
* HELPER FUNCTIONS
* Template rendering for the top panel and jquery event handlers
**************************************************************/
function loadTopPanel(cards) {
	var tmpl = $('#tmpl-game-top-card').html();
	$("#black-card-panel").html("");
	var compiledtmpl = _.template(tmpl, {black_card: cards.black_card});
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
			$(this).text("Waiting for Judge....");
			$(this).attr('disabled', 'disabled');
			var content = $('.chosenCard').children()[0].innerHTML;

			socket.emit('card submission', {
				'room': room,
				'player': user,
				'card': {'id': card, 'content': content}
			});

			// remove the selected card from the player panel
			$('.selected').remove();

			$("#cards-panel").hide();
			$("#submitted-panel").show();
		} else {
			alert("You must select a card first")
		}

	});
}

function bindPlayerPanel() {
	// unbind handler that were bound to cards from previous turns
	$('.useCard').unbind('click');

	//Toggle between chosen card
	$('.useCard').on('click', function() {
		var cardID =  $(this).attr('id')
		var cardText = $(this).children().first().children()[0].innerHTML
		$('.chosenCard').attr('id', cardID);
		$('.chosenCard').children()[0].innerHTML = cardText;

		//remove all selected tags.
		$('.selected').removeClass('selected').addClass('white');
		$(this).removeClass('white').addClass('selected');
	});
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
			black_card = $('.black');
			// notify players of the choice through the server
			socket.emit('judge submission', {
				'room': room,
				'player': user,
				'white_card': {'id': card, 'content': content},
				'black_card': {'id': black_card.attr('id')}
			});
			// tell server to start next turn
			socket.emit('begin turn', {'room': room});
			$('#judge-panel').hide();
			$("#cards-panel").show();

		} else {
			alert("You must select a card first")
		}
	});
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
	});
}

function bindChatButton() {

	$("#submit-chat").on('click', function(){
		var message = $("#message").val();

		createChatMessage(message, user);
		//scrollToBottom();

		// Send the message to the other person in the chat
		socket.emit('msg', {msg: message, player: user});

		// Empty the textarea
		$("#message").val("");

	});
}