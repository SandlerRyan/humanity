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


function bindPlayerButton(player_timer) {
	// unbind previous handlers attached when user was a judge
	// or when user submitted the last card
	$('#confirmButton').unbind('click');
	$('#confirmButton').removeAttr('disabled');
	$('#confirmButton').text("Confirm Submission");

	$('#confirmButton').on('click', function() {
		var card = $('.chosenCard').attr('id')
		if (card != "")
		{
			// disable the button
			$(this).text("Waiting for Judge....");
			$(this).attr('disabled', 'disabled');
			var content = $('.chosenCard').children()[0].innerHTML;

			// notify the server
			socket.emit('card submission', {
				'room': room,
				'player': user,
				'card': {'id': card, 'content': content}
			});
			// clear the timeout so the player doesn't submit card twice
			clearTimeout(player_timer);
			$('#t').text('gone!');

			// remove the selected card from the player panel
			$('.selected').remove();

			// hide the current hand and start showing other players' submissions
			$("#cards-panel").hide();
			$("#submitted-panel").show();

			// update the scoreboard to show submitted
			markSubmitted(user.id);

		} else {
			alert("You must select a card first")
		}

	});
}

function bindPlayerPanel() {
	// unbind handler that were bound to cards from previous turns
	$('.useCard').unbind('click');

	// Toggle between chosen card
	$('.useCard').on('click', function() {
		var cardID =  $(this).attr('id')
		var cardText = $(this).children().first().children()[0].innerHTML
		$('.chosenCard').attr('id', cardID);
		$('.chosenCard').children()[0].innerHTML = cardText;

		// remove all selected tags
		$('.selected').removeClass('selected').addClass('white');
		$(this).removeClass('white').addClass('selected');
	});
}

function bindJudgeButton() {
	// unbind previous handlers attached when user was a player
	$('#confirmButton').unbind('click');
	$('#confirmButton').text("Waiting for player submissions...");

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

			// increment player's score
			/**** BUG HERE: JUDGE ALWAYS WINS!!!! ****/
			updateScore(user.id);

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

function updateScore(player_id) {
	var score = parseInt($('#score-' + player_id).text()) + 1
	$('#score-' + player_id).text(String(score))
}

function markSubmitted(player_id) {
	$('#submitted-' + player_id).html(
		"<img src='http://www.electronicsfleamarket.com/images/checkmark_tiny_icon.gif' height='10' width='10'>");
}

function resetAllSubmitted() {
	$(".submitted-cell").html('');
}

function markJudge(player_id) {
	console.log('JUDGE:' + player_id);
	$('#submitted-' + player_id).html('<span>JUDGE</span>');
}

