var Model = require('./Base');

var Player = Model.extend({

	tableName: 'players',

	hasTimestamps: ['created_at', 'updated_at'],

	games: function() {
		return this.belongsToMany('./Game');
	},

	wins: function() {
		return this.hasMany('./Game');
	}

});

module.exports = Player;