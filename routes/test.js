exports.test1 = function(req,res) {

if (req.user == undefined){
	res.json('no user');
	
}
else{
	res.json(req.user);
}

}