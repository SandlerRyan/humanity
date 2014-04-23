var Player = require('../models/Player')
var Game = require('../models/Game')

module.exports = function(game) {

	newPlayer = function(data) {
		console.log('NEW USER JOINED!!!');
		// join the given room number
		this.join(data.room);

		// send the new player to all the other players
		// game.in(data.room).emit('new player', data.player);
		// send all the other players to the new player
		// game.emit('new player', players);
		Game.find(data.room).then(function (model) {
			// debugger;
			// tell the client side who the creator is so a start button can be rendered
			if (model.get('creator_id') == data.player.id) {
				game.emit('creator');
			}
		}).catch(function(e) {
			console.log(e.stack);
			res.json(400, {error: e.message});
		});
		// add to our player list
		try {
			players[data.room].push({'player': data.player, 'socket': this.id});
		}
		// or if room has just been created, add it to the players object
		catch (e) {
			players[data.room] = [];
			players[data.room].push({'player': data.player, 'socket': this.id});
		}

		game.in(data.room).emit('new player', players[data.room]);
		console.log(players);
	}
};