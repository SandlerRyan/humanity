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
        done(null, user);
    });

    // used to deserialize the user
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    console.log("session done")
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
        new Player({fb_key: profile.id}).fetch({require: true})

        // find user
        .then(function(existing_user) {
            return done(null, existing_user);

        // or create if the user is not in database
        }).catch(function(e) {
            return new Player({
            fb_key: profile.id,
            first: profile.name.givenName,
            last: profile.name.familyName,
            image_url: 'http://graph.facebook.com/' +
                profile.id + '/picture?type=large',
            }).save()
        }).then(function(new_user){
            return done(null, new_user);
        }).catch(function(e) {
            console.log(e.stack);
            return done(e);
        });

    }));
};