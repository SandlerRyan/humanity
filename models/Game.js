var Model = require('./Base');

var Game = Model.extend({

	tableName: 'games'

	players: function() {
		return this.belongsToMany('./Player');
	},

	winner: function() {
		return this.belongsTo('./Player');
	}
});

module.exports = Field;