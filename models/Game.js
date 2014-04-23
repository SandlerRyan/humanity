var Model = require('./Base');

var Game = Model.extend({

	tableName: 'games',

	hasTimestamps: ['created_at', 'updated_at'],

	players: function() {
		return this.belongsToMany(require('./Player')).through(require('./GamePlayer'));
	},

	winner: function() {
		return this.belongsTo(require('./Player'));
	}
});

module.exports = Game;