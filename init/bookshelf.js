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
    charset  : 'utf8'
  }
});

module.exports = bookshelf;