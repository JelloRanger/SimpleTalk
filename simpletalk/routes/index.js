var express = require('express');
var router = express.Router();
var entities = require('entities');
var sampleStructure = require('../lib/sampleStructure.json');
var CommentTree = require('../lib/CommentTree');

// display comment tree
router.get('/', function(req, res, next) {
  	var db = req.db;

  	var collection = db.get('comments');

  	if (req.session.username) {
  		console.log(req.session.username + " has logged in.");
  	} else {
  		console.log("An anonymous user has connected.");
  	}

	collection.find({}, {}, function(err, docs) {		
		ct = new CommentTree(docs[0]);

		var treeString = ct.displayComments(req.session.username);

		res.render('index', {
			"tree": treeString
		});
	});

});

router.post('/logout', function(req, res) {
	console.log(req.session.username + " has logged out.");
	delete req.session.username;
	res.send();
});

// check if the provided username and password exists in database
function authenticateUser(collection, username, password, callback) {

	collection.findOne({user: username, pass: password}, function(err, docs) {
		callback(err, docs);
	});
}

router.post('/login', function(req, res) {

	var db = req.db;
	var collection = db.get('users');

	// grab username and password
	var username = req.body.loginUser;
	var password = req.body.loginPass;

	// DEBUG
	console.log("username: " + username);
	console.log("password: " + password);

	authenticateUser(collection, username, password, function(err, user) {
		if (user) {

			req.session.username = user.user;

			res.redirect('/');
		} else {
			res.render({error: err});
		}
	})
});

function createUser(collection, username, password, confirmPass, callback) {

	if (password !== confirmPass) {

		var err = "Passwords don't match.";
		callback(err);
	} else {

		// check if username already exists in database
		collection.findOne({user: username}, function(err, docs) {

			if (docs) {
				var err = "Username already exists.";
				callback(err);
			} else {

				collection.insert({user: username, pass: password, bubbleId: []}, function(err, user) {
					callback(err, user);
				});
			}
		});
	}
}

// handle user registration
router.post('/register', function(req, res, next) {

	var db = req.db;
	var collection = db.get('users');

	var username = req.body.registerUser;
	var password = req.body.registerPass;
	var confirmPass = req.body.registerConfirmPass;

	// DEBUG
	console.log("username: " + username);
	console.log("password: " + password);
	console.log("confirm password: " + confirmPass);

	// check if passwords match
	createUser(collection, username, password, confirmPass, function(err, user) {

		if (err) {
			console.log("wtf");
			res.send({error: err});
		} else {
			req.session.username = user.user;
			res.send();
		}
	});


});

// handle add comment call
router.post('/addcomment', function(req, res) {

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
		addComment(db, collection, content, parent, req.session.username);
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

// handle pin bubble call
router.post('/pinbubble', function(req, res) {

	var db = req.db;
	var commentCollection = db.get('comments');
	var userCollection = db.get('users');

	var bubbleId = req.body.bubbleId;

	if (req.session.username) {

		// DEBUG
		console.log(req.session.username + " has requested to pin bubble " +  bubbleId);

		// add bubble ID to list of pinned bubbles for the user (if it's not already there)
		userCollection.update({user: req.session.username}, { $addToSet: { bubbleId: bubbleId }});
	}

	res.send();
});

// update the database given an updated comment tree structure
function updateDatabase(db, collection, ct) {
	var structure = ct.getStructure();
	collection.update({ _id : structure._id}, structure, { upsert: true});

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
function addComment(db, collection, commentContent, parent, user) {

	// retrieve comment tree, add comment
	collection.find({}, {}, function(err, docs) {
		ct = new CommentTree(docs[0]);

		ct.addComment(commentContent, parent, user);

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
