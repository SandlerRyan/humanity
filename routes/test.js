var Player = require('../models/Player');

exports.test1 = function(req,res) {
	console.log('hello');




	new Player({
		id: 1,
		fb_key: '1212',
		first: 'Ryan',
		last: 'Sandler'
	});

}
/*
	console.log('hello');

	
	// save our user to the database
    newUser.save(function(err) {
        if (err)
            throw err;

        // if successful, return the new user
        return done(null, newUser);
    });

    res.render('main/lobby');*/
	


