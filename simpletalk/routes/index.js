var express = require('express');
var router = express.Router();
var sampleStructure = require('../lib/sampleStructure.json');
var CommentTree = require('../lib/CommentTree');

// display commen tree
router.get('/', function(req, res, next) {
  	var db = req.db;

  	var collection = db.get('comments');
	
	collection.find({}, {}, function(err, docs) {		
		var ct = new CommentTree(docs[0]);

		ct.addIDs();

		var treeString = ct.displayComments();

		res.render('index', {
			"tree": treeString
		});
	});
});

// handle add comment call
router.post('/addcomment', function(req, res) {
	
	// grab parent id if available
	var parent = req.body.parent;

	// if no parent available, add new bubble
	//addBubble();

	console.log(parent);

	res.redirect('/');
});

module.exports = router;
