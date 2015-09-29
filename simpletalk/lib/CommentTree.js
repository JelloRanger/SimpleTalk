/**
*	Author: Jacob Abramson
*	Date: 8/3/2015
*
*	An implementation of a comment tree with multiple children per node
*/

// modules
var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');
var sanitizeHtml = require('sanitize-html');
var Elements = require('./Elements.js');

// constructor
function CommentTree(properties) {
	this.structure = properties;
}

// display the comments
CommentTree.prototype.displayComments = function(user) {

	var tree = this.structure;
	var treeString = { ts: '' };
	var elements = new Elements();

	treeString.ts += elements.getGroupPrefix();

	if (tree) {

		// sort bubbles by time created
		tree.bubbles.sort(sort_by('timeCreated', true, moment));

		// iterate through each bubble
		for (i in tree.bubbles) {

			// traverse all comment nodes
			generateTreeStructure(tree.bubbles[i], treeString, user);
		}
	}

	treeString.ts += elements.getGroupSuffix();
	treeString.ts += elements.getReplyForm();

	return treeString.ts;
}

// create new IDs for all comments/bubbles
CommentTree.prototype.addIDs = function() {

	var tree = this.structure;

	this.structure._id = new ObjectID();

	for (i in tree.bubbles) {
		
		traverse(tree.bubbles[i], addID);
	}

}

// return JSON structure of the comment tree
CommentTree.prototype.getStructure = function() {

	return this.structure;
}

// add bubble to the comment tree
CommentTree.prototype.addBubble = function(bubbleN) {

	// if tree isn't created, create one TODO: FIX BUBBLE DELETE DB ISSUE
	if (!this.structure) {
		console.log("Creating tree...");
		console.log("THIS SHOULD NEVER HAPPEN");
		this.structure = { bubbles: [] };
	}

	var tree = this.structure;

	// sanitize bubble name
	var cleanBubbleName = sanitizeHtml(bubbleN,  { allowedTags: [] });

	tree.bubbles.push({ bubbleName : cleanBubbleName, points : 0, timeCreated : new Date().toISOString(), children : [], id : new ObjectID()});
}

// add comment to the comment tree given its parent
CommentTree.prototype.addComment = function(commentContent, parent, user) {

	var tree = this.structure;

	for (i in tree.bubbles) {

		traverseAdd(tree.bubbles[i], checkParent, commentContent, parent, user);
	}
}

// update comment from the comment tree given its id
CommentTree.prototype.updateComment = function(commentContent, commentId) {

	var tree = this.structure;

	for (i in tree.bubbles) {

		traverseUpdate(tree.bubbles[i], commentContent, commentId);
	}
}

// remove comment from the comment tree given its id
CommentTree.prototype.removeComment = function(commentId) {

	var tree = this.structure;

	for (i in tree.bubbles) {

		// check if bubble id matches, if so delete
		if (tree.bubbles[i].id == commentId) {
			console.log("Deleting bubble...");
			delete tree.bubbles.splice(i, 1);
			break;
		}

		// recurse further into comment tree
		traverseRemove(tree.bubbles[i], commentId);
	}
}

// add comment if the parent matches
function checkParent(node, commentContent, parent, user) {
	
	// if node matches parent id, add the comment to children
	if (node.id == parent) {

		// sanitize comment content
		console.log(commentContent);
		var cleanComment = sanitizeHtml(commentContent);

		node.children.push({ author : user, points : 0, timeCreated : new Date().toISOString(),
							 comment : cleanComment, children : [], id : new ObjectID()});
	}
}

// create new ID for individual node
function addID(node) {
	node.id = new ObjectID();
}

// traverse nodes, applying the function and args provided
function traverseAdd(node, fn, commentContent, parent, user) {
	fn(node, commentContent, parent, user);

	for (i in node.children) {
		traverseAdd(node.children[i], fn, commentContent, parent, user);
	}
}

// traverse nodes, updating comment if found
function traverseUpdate(node, commentContent, commentId) {

	for (i in node.children) {

		// check if comment id matches, if so update
		if (node.children[i].id == commentId) {
			console.log("Updating comment...");
			var cleanComment = sanitizeHtml(commentContent);
			node.children[i].comment = cleanComment;
			node.children[i].timeLastEdited = new Date().toISOString();
			break;
		}

		// recurse further into comment tree
		traverseUpdate(node.children[i], commentContent, commentId);
	}
}

// traverse nodes, removing comment if found
function traverseRemove(node, commentId) {

	for (i in node.children) {

		// check if comment id matches, if so delete
		if (node.children[i].id == commentId) {
			console.log("Deleting comment...");
			delete node.children.splice(i, 1);
			break;
		}

		// recurse further into comment tree
		traverseRemove(node.children[i], commentId);
	}
}

// traverse nodes, applying the function provided
function traverse(node, fn) {
	fn(node);

	for (i in node.children) {
		traverse(node.children[i], fn);
	}
}

// for testing purposes
function printTree(node, indent, treeString) {
	if (node.bubbleName)
		treeString.ts += indent + node.bubbleName + "\n";
	else
		treeString.ts += indent + node.comment + "\n";
	for (i in node.children) {
		traverse(node.children[i], indent + "--", treeString);
	}
}

// generate the tree structure in html
function generateTreeStructure(node, treeString, user) {

	var elements = new Elements();

	if (node.bubbleName)
		treeString.ts += elements.getBubbleItemPrefix(node, false);
	else
		treeString.ts += elements.getCommentItemPrefix(node);

	// add delete button if the user authored the comment or user is admin
	if (user == "admin" || (node.author && node.author == user))
		treeString.ts += elements.getDeleteForm(node);

	if (node.bubbleName)
		treeString.ts += elements.getCloseBubbleForm();

	treeString.ts += elements.getTimestamp(node);

	
	if (node.bubbleName)
		treeString.ts += elements.getBubbleText(node.bubbleName);
	else
		treeString.ts += elements.getCommentText(node.comment);

	if (!node.bubbleName) {
		// add last edited time if it differs from time created for comments
		treeString.ts += elements.getEditTimestamp(node);

		// add edit button form for comments if the user authored it
		if (node.author == user)
			treeString.ts += elements.getEditForm(node);
	}

	// add share button
	treeString.ts += elements.getShareButton(node);

	// add reply form if user is logged in
	if (user)
		treeString.ts += elements.getReplyForm(node);

	treeString.ts += elements.getGroupPrefix();

	// sort children comments by time created
	node.children.sort(sort_by('timeCreated', true, moment));

	for (var i = 0; i < node.children.length; i++) {
		generateTreeStructure(node.children[i], treeString, user);
	}

	treeString.ts += elements.getGroupSuffix();
	
	treeString.ts += elements.getItemSuffix();
}

// return the time that the node was created relative to now
/*function getTimeFromNow(node) {
	return "<span class='timeCreated pull-right'>" + moment(node.timeCreated).fromNow() + "</span>";
}*/

// return the time last edited
/*function getTimeLastEdited(node) {

	// display time last edited if it differs from time created
	if (node.timeLastEdited)
		return "<span class='timeLastEdited'>last edited " + moment(node.timeLastEdited).fromNow() + "</span>";
	return "<span class='timeLastEdited'></span>";
}*/

// add in comment id into delete comment form
/*function getDeleteCommentForm(node) {

	if (!node.id)
		return delForm;

	return delPrefix + node.id + delSuffix;
}*/

// add in comment id into edit comment form
/*function getEditCommentForm(node) {
	return editPrefix + node.id + editSuffix;
}*/

// add in parent comment id into comment form
/*function getReplyForm(node) {

	if (!node.id)
		return replyForm;

	return replyPrefix + node.id + replySuffix;
}*/

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