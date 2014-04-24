var GamePlayer = require('./models/GamePlayer');
// route middleware to make sure a user is logged in
function errorHandler(e) {
	console.log(e.stack);
	res.json(400, {error: e.message});
}

exports.isLoggedIn = function(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
},

exports.findJudgeSocket = function (room_id, callback) {
	new GamePlayer({
		game_id: room_id
	}).fetch()
	.then(function(collection) {
		console.log("LIST OF GAMERS")
		console.log(room_id)
		console.log(collection)
		// collection.comparator = "judged";
		//I WILL ASSUME THIS IS SORTED
		// collection.sort();
		
		if (collection.get('judged')) {

			collection.forEach(function(model) {
				model.set({judged: 0}).save().then(function(){}).catch(errorHandler);
				callback(collection[0]);
			})	
		} else {
			collection[0].set({judged: 1}).save().then(function() {}).catch(errorHandler);
			callback(collection[0]);
		}
	})	
}