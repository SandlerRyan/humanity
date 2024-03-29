var GamePlayer = require('./models/GamePlayer');
var WhiteCard = require('./models/WhiteCard');
var BlackCard = require('./models/BlackCard');

var Promise = require('bluebird');

// route middleware to make sure a user is logged in
function errorHandler(e) {
	console.log(e.stack);
}

// helper function to shuffle a deck
//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

exports.isLoggedIn = function(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
},

exports.findJudgeSocket = function (room_id, callback) {
	GamePlayer.collection().query('where', {game_id: room_id, connected: 1}).fetch()
	.then(function (collection) {
		collection.comparator = "judged";
		collection.sort();

		// this happens when everyone has judged once already
		if (collection.models[0].get('judged')) {
			// now set everyone to zero
			collection.forEach(function(model) {
				model.set({judged: 0}).save()
			});
			callback(collection.models.shift(), collection.models);
		}
		// pull off the first person (who has not judged yet, since list is sorted)
		// and make them the judge by calling the callback
		else {
			collection.models[0].set({judged: 1}).save();
			callback(collection.models.shift(), collection.models);
		}
	}).catch(errorHandler);
},

exports.getAllCards = function() {

	return Promise.props({
        white: WhiteCard.fetchAll().call('shuffle'),
        black: BlackCard.fetchAll().call('shuffle')
    })
}

