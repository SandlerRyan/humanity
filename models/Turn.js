var Model = require('./Base');

var Turn = Model.extend({

	tableName: 'turns',

	game: function () {
		return this.belongsTo(require('./Game'));
	},

	whitecard1: function () {
		return this.belongsTo(require('./WhiteCard'));
	},

	whitecard2: function () {
		return this.belongsTo(require('./WhiteCard'));
	},

	blackcard: function() {
		return this.belongsTo(require('./BlackCard'));
	}

});

module.exports = Turn;