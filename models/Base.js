var bookshelf = require('../init/bookshelf');

var BaseModel = bookshelf.Model.extend({

	// setup any
	displayName: function() {
		return this.get('name') || 'no name';
	}

});

// Add a simple "static" finder method, for creating
// a new instance of a model and finding by "id".
BaseModel.find = function(id, options) {
	return new this({id: id}).fetch(options);
};

module.exports = BaseModel;