var Bookshelf = require('bookshelf');

// Connect to Database
var bookshelf = Bookshelf.initialize({
  client: 'mysql',
  connection: {
    // your connection config
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'humanity',
    charset  : 'UTF8_GENERAL_CI'
  }
});

module.exports = bookshelf;