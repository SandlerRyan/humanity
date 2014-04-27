var Model = require('./Base');

var GamePlayer = Model.extend({

	tableName: 'games_players',

	defaults: {judged: 0},

	game: function() {
		return this.belongsTo(require('./Game'));
	},

	player: function() {
		return this.belongsTo(require('./Game'));
	}

});

module.exports = GamePlayer;