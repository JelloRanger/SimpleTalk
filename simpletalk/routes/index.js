var express = require('express');
var router = express.Router();
var entities = require('entities');
var sampleStructure = require('../lib/sampleStructure.json');
var CommentTree = require('../lib/CommentTree');

// display comment tree
router.get('/', function(req, res, next) {
  	var db = req.db;

  	var collection = db.get('comments');

	collection.find({}, {}, function(err, docs) {		
		ct = new CommentTree(docs[0]);

		var treeString = ct.displayComments();

		res.render('index', {
			"tree": treeString
		});
	});

});

// handle add comment call
router.post('/addcomment', function(req, res) {
	
	// DEBUG
	//console.log('body: ' + JSON.stringify(req.body));

	var db = req.db;
	var collection = db.get('comments');

	// grab parent id if available
	var parent = req.body.parent;
	var content = req.body.commentContent;

	// DEBUG
	console.log("parent: " + parent);
	console.log("content: " + content);

	// if no parent available, add new bubble
	if (!parent || parent == "") {
		console.log("Adding a bubble...");
		addBubble(db, collection, content);
	}
	// otherwise, add comment to tree
	else {
		console.log("Adding a comment...");
		addComment(db, collection, content, parent);
	}

	// let the client know the request was successful
	res.send();
});

// handle edit comment call
router.post('/editcomment', function(req, res) {

	var db = req.db;
	var collection = db.get('comments');

	var revisedCommentText = entities.decodeHTML(req.body.text);
	var commentId = req.body.commentId;

	// DEBUG
	console.log(revisedCommentText);
	console.log(commentId);

	updateComment(db, collection, revisedCommentText, commentId);

	res.send();
});

// handle delete comment call
router.post('/delcomment', function(req, res) {

	var db = req.db;
	var collection = db.get('comments');

	// grab comment id if available
	var commentId = req.body.commentId;

	// if no comment id, do nothing
	if (!commentId) {
		console.log("No comment ID found.");
		res.redirect('/');
		return;
	}

	console.log("Comment id: " + commentId);

	// remove comment
	removeComment(db, collection, commentId);

	res.redirect('/');
});

// update the database given a new comment tree structure
// NOTE: Right now this is done by deleting the tree structure
// in the database, and then inserting the updated version.
// Obviously, this is a very bad way of doing things. Moving forward,
// I plan to switch to a different, more powerful library for interfacing
// with MongoDB, so database functionality such as save() is available.
function updateDatabase(db, collection, ct) {
	collection.remove({});
	collection.insert(ct.getStructure());
}

// add bubble to the comment tree
function addBubble(db, collection, bubbleName) {

	// retrieve comment tree, add parent
	collection.find({}, {}, function(err, docs) {
		ct = new CommentTree(docs[0]);

		ct.addBubble(bubbleName);

		updateDatabase(db, collection, ct);
	});

}

// add comment to the comment tree given its parent id
function addComment(db, collection, commentContent, parent) {

	// retrieve comment tree, add comment
	collection.find({}, {}, function(err, docs) {
		ct = new CommentTree(docs[0]);

		ct.addComment(commentContent, parent);

		updateDatabase(db, collection, ct);
	});

}

// update comment in the database given the comment id
function updateComment(db, collection, commentContent, commentId) {

	// retrieve comment tree, update comment
	collection.find({}, {}, function(err, docs) {
		ct = new CommentTree(docs[0]);

		ct.updateComment(commentContent, commentId);

		updateDatabase(db, collection, ct);
	});
}

// remove comment from the comment tree given the comment id
function removeComment(db, collection, commentId) {

	// retrieve comment tree, remove comment
	collection.find({}, {}, function(err, docs) {
		ct = new CommentTree(docs[0]);

		ct.removeComment(commentId);

		updateDatabase(db, collection, ct);
	});
}

module.exports = router;
