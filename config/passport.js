// config/passport.js

// load all the things we need
//var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// load up the user model
var Player = require('../models/Player');


// load the auth variables
var configAuth = require('./auth');

module.exports = function(passport) {

	// used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        Player.findById(id, function(err, user) {
            done(err, user);
        });
    });
    
	// code for login (use('local-login', new LocalStategy))
	// code for signup (use('local-signup', new LocalStategy))

	// =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

		// pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL

    },

    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {
        console.log('FB Logged!');
        /*
		// asynchronous
		process.nextTick(function() {

			// if the user is found, then log them in
            var matched = Player.collection().get(profile.id);

            if (!matched)
            {
            	// if there is no user found with that facebook id, create them

            	var newUser = 
            	new Player({
					id: profile.id,
					fb_key: token,
					first: profile.name.givenName,
					last: profile.name.familyName,
					email: profile.emails[0].value
				});


                
				// save our user to the database
                newUser.save(function(err) {
                    if (err)
                        throw err;

                    // if successful, return the new user
                    return done(null, newUser);
                });

            }
            else{
            	return done(null, matched[0]); // user found, return that user

            } */
		}));

};