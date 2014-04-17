var Model = require('./Base');

var Player = Model.extend({

	tableName: 'players',

	games: function() {
		return this.belongsToMany('./Game');
	},

	wins: function() {
		return this.hasMany('./Game');
	}

});

module.exports = Player;