var GamePlayer = require('./models/GamePlayer');
var WhiteCard = require('./models/WhiteCard');
var BlackCard = require('./models/BlackCard');

// route middleware to make sure a user is logged in
function errorHandler(e) {
	console.log(e.stack);
	res.json(400, {error: e.message});
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
	GamePlayer.collection().query(function(qb) {
		qb.where('game_id', '=', room_id).andWhere('connected', '=', 1);
	}).fetch().then(function(collection) {
		collection.comparator = "judged";
		collection.sort();

		// this happens when everyone has judged once already
		if (collection.models[0].get('judged')) {
			// now set everyone to zero
			collection.forEach(function(model) {
				model.set({judged: 0}).save().then(function(){}).catch(errorHandler);
			});
			callback(collection.models.shift(), collection.models);
		}
		// pull off the first person (who has not judged yet, since list is sorted)
		// and make them the judge by calling the callback
		else {
			collection.models[0].set({judged: 1}).save().then(function() {}).catch(errorHandler);
			callback(collection.models.shift(), collection.models);
		}
	})
},

exports.getAllCards = function(callback) {

	var data = {}
	WhiteCard.collection().fetch().then(function(collection) {
		data['white'] = shuffle(collection.toJSON());
		BlackCard.collection().fetch().then(function(collection) {
			data['black'] = shuffle(collection.toJSON());

			callback(data);
		}).catch(errorHandler);
	}).catch(errorHandler);
}