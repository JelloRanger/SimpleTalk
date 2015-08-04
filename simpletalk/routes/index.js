var express = require('express');
var router = express.Router();
var sampleStructure = require('../lib/sampleStructure.json');
var CommentTree = require('../lib/CommentTree');

/* GET home page. */
router.get('/', function(req, res, next) {
  /*var db = req.db;

  var collection = db.get('comments');

  collection.find({}. {}. function(err, docs) {
  	res.render('index', {
  		"root": docs
  	});
  });*/


	var ct = new CommentTree(sampleStructure);

	var treeString = ct.displayComments();

	//res.contentType('text/plain');
	res.render('index', {
		"tree": treeString
	});
});

var initializeDatabase = function(db) {
	var collection = db.get('comments');

	collection.insert()
}

module.exports = router;
