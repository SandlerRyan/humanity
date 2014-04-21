var passport = require('passport');

// pass passport for configuration
require('../config/passport.js')(passport); 

// export passport
module.exports = passport;