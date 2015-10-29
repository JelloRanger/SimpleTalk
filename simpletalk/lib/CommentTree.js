/**
*	Author: Jacob Abramson
*	Date: 8/3/2015
*
*	An implementation of a (comment) tree with an arbitrary number of children per node
*/

// modules
var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');
var sanitizeHtml = require('sanitize-html');
var Elements = require('./Elements.js');

// initialize CommentTree with JSON structure
function CommentTree(properties) {
	this.structure = properties;
}

// return JSON structure of the comment tree
CommentTree.prototype.getStructure = function() {

	return this.structure;
}

// Display the comments with HTML markup
CommentTree.prototype.displayComments = function(user) {

	var treeString = { ts: '' };
	var elements = new Elements();

	treeString.ts += elements.getGroupPrefix();

	if (this.structure) {

		// sort bubbles by time created
		this.structure.bubbles.sort(sort_by('timeCreated', true, moment));

		// iterate through each bubble
		for (i in this.structure.bubbles) {

			// traverse all comment nodes
			generateTreeStructure(this.structure.bubbles[i], treeString, user);
		}
	}

	treeString.ts += elements.getGroupSuffix();
	treeString.ts += elements.getReplyForm();

	return treeString.ts;
}

// add bubble to the comment tree
CommentTree.prototype.addBubble = function(bubbleN) {

	var tree = this.structure;

	// sanitize bubble name to get rid of all HTML markup in the bubble name
	var cleanBubbleName = sanitizeHtml(bubbleN,  { allowedTags: [] });

	// push JSON bubble object to our list of bubbles
	tree.bubbles.push({ 
		bubbleName : cleanBubbleName, 
		points : 0, 
		timeCreated : new Date().toISOString(), 
		children : [], 
		id : new ObjectID()
	});
}

// add comment to the comment tree given its parent comment id
CommentTree.prototype.addComment = function(commentContent, parent, user) {

	for (i in this.structure.bubbles) {

		traverseComments(this.structure.bubbles[i], insertComment, commentContent, parent, user);
	}
}

// traverse comment nodes until parent id found, then insert comment
function traverseComments(node, insert, commentContent, parent, user) {
	
	// if node matches parent id, add the comment to list of children comments and return
	if (node.id == parent) {
		insert(node, commentContent, parent, user);
		return;
	}

	for (i in node.children) {
		traverseAdd(node.children[i], fn, commentContent, parent, user);
	}
}

// add comment if the parent id matches
function insertComment(node, commentContent, parent, user) {

	// sanitize comment content to get rid of unwanted HTML markup
	var cleanComment = sanitizeHtml(commentContent);

	// push JSON comment object to our structure in the appropriate location
	node.children.push({ 
		author : user, 
		points : 0, 
		timeCreated : new Date().toISOString(),
		comment : cleanComment, 
		children : [], 
		id : new ObjectID()
	});
}

// update comment content given its id
CommentTree.prototype.updateComment = function(commentContent, commentId) {

	for (i in this.structure.bubbles) {

		traverseUpdate(this.structure.bubbles[i], commentContent, commentId);
	}
}

// traverse nodes, updating comment if found
function traverseUpdate(node, commentContent, commentId) {

	for (i in node.children) {

		// check if comment id matches, if so update
		if (node.children[i].id == commentId) {
			console.log("Updating comment...");

			// sanitize comment content to get rid of unwanted HTML markup
			var cleanComment = sanitizeHtml(commentContent);
			
			node.children[i].comment = cleanComment; // update comment content
			node.children[i].timeLastEdited = new Date().toISOString(); // update time last edited
			return;
		}

		// recurse further into comment tree if not found
		traverseUpdate(node.children[i], commentContent, commentId);
	}
}

// remove comment/bubble from the CommentTree given its id
CommentTree.prototype.removeComment = function(commentId) {

	for (i in this.structure.bubbles) {

		// check if bubble id matches, if so delete it
		if (this.structure.bubbles[i].id == commentId) {
			console.log("Deleting bubble...");
			delete this.structure.bubbles.splice(i, 1);
			return;
		}

		// recurse further into comment tree
		traverseRemove(this.structure.bubbles[i], commentId);
	}
}

// traverse comment nodes, removing comment if found
function traverseRemove(node, commentId) {

	for (i in node.children) {

		// check if comment id matches, if so delete it
		if (node.children[i].id == commentId) {
			console.log("Deleting comment...");
			delete node.children.splice(i, 1);
			return;
		}

		// recurse further into comment tree if not found
		traverseRemove(node.children[i], commentId);
	}
}

// generate the tree structure with the proper HTML markup
// given the JSON structure of the comment tree
function generateTreeStructure(node, treeString, user) {

	// instantiate our resource class that contains
	// our HTML markup
	var elements = new Elements();

	if (node.bubbleName)
		treeString.ts += elements.getBubbleItemPrefix(node);
	else
		treeString.ts += elements.getCommentItemPrefix(node);

	// add delete button if the user logged in authored the comment or if the user is admin
	if (user == "admin" || (node.author && node.author == user))
		treeString.ts += elements.getDeleteForm(node);

	// bubbles can be minimized or pinned
	if (node.bubbleName) {
		treeString.ts += elements.getPinBubbleForm();
		treeString.ts += elements.getCloseBubbleForm();
	}

	// include timestamp for when a bubble/comment was created
	treeString.ts += elements.getTimestamp(node);

	// this contains the actual content of the bubble/comment
	if (node.bubbleName)
		treeString.ts += elements.getBubbleText(node.bubbleName);
	else
		treeString.ts += elements.getCommentText(node.comment);

	// add time last edited for comments as well as the edit form if the user
	// currently logged in originally authored the comment
	if (!node.bubbleName) {
		// add last edited time if it differs from time created for comments
		treeString.ts += elements.getEditTimestamp(node);

		// add edit button form for comments if the user authored it
		if (node.author == user)
			treeString.ts += elements.getEditForm(node);
	}

	// add share button (includes a link to the specific comment once clicked)
	treeString.ts += elements.getShareButton(node);

	// add a reply form if the user is logged in
	if (user)
		treeString.ts += elements.getReplyForm(node);

	// begin the list of child comments/bubbles
	treeString.ts += elements.getGroupPrefix();

	// sort children comments by time created (more recent comments appear on top)
	node.children.sort(sort_by('timeCreated', true, moment));

	// recurse into the comment tree to generate other comments' HTML markup
	for (var i = 0; i < node.children.length; i++) {
		generateTreeStructure(node.children[i], treeString, user);
	}

	// close our HTML tags
	treeString.ts += elements.getGroupSuffix();
	treeString.ts += elements.getItemSuffix();
}

// sort function that takes in the respective field being evaluated,
// true/false to reverse the sort, and the primer being the method of sorting
// i.e. do we sort by alphabetical, by number, time, etc..
// NOTE: This was not written by me, found on StackOverflow
var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}

module.exports = CommentTree;