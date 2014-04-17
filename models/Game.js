var Model = require('./Base');

var Game = Model.extend({

	tableName: 'games'

	players: function() {
		return this.belongsToMany(require('./Player'));
	},

	winner: function() {
		return this.belongsTo(require('./Player'));
	}
});

module.exports = Game;