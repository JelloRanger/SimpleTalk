var express = require('express');
var router = express.Router();
var sampleStructure = require('../lib/sampleStructure.json');
var CommentTree = require('../lib/CommentTree');

/* GET home page. */
router.get('/', function(req, res, next) {
  	var db = req.db;

  	var collection = db.get('comments');
	
	collection.find({}, {}, function(err, docs) {		
		var ct = new CommentTree(docs[0]);

		var treeString = ct.displayComments();

		res.render('index', {
			"tree": treeString
		});
	});
});

module.exports = router;
