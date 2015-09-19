/**
*	Author: Jacob Abramson
*	Date: 8/3/2015
*
*	An implementation of a comment tree with multiple children per node
*/

// imports
var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');
var sanitizeHtml = require('sanitize-html');

// prefix/suffix for bubble name/comment items
bubbleNamePrefix = "<li class='list-group-item bubbleItem'>";
commentPrefix = "<li class='list-group-item'>";
bubbleNameSuffix = "";
itemSuffix = "</li>";

groupPrefix = "<ul class='list-group'>";
groupSuffix = "</ul>";

replyPrefix = "<form class='addCommentForm' name='addcomment' id='addCommentForm'>" +
				"<div class='input-group'>" +
					"<input class='form-control commentContent oneLine' required type='text' placeholder='Reply!' name='commentContent'>" +
					"<textarea style='display:none' rows='4' disabled class='form-control commentContent multiLine' placeholder='Reply!' name='commentContent'></textarea>" +
					"<input class='form-control commentParent' type='hidden' name='parent' value='";

replySuffix = "'>" +
					"<span class='input-group-btn'>" +
						"<button class='btn btn-danger expandButton' type='button' title='Expand'>+</button>" +
						"<button class='btn btn-danger submitButton' type='submit' title='Submit Comment'>submit</button>" +
					"</span>" +
				"</div></form>";

replyForm = "<div id='addCommentContainer'><form class='addCommentForm' name='addcomment' id='addCommentForm'>" +
				"<div class='input-group'>" +
					"<input class='form-control' required='required' id='commentContent' type='text' placeholder='Add Bubble!' name='commentContent'>" +
					"<input class='form-control' id='parent' type='hidden' name='parent'>" +
					"<span class='input-group-btn'>" +
						"<button class='btn btn-danger submitButton' type='submit' title='Add Bubble'>add</button>" +
					"</span>" +
				"</div></form></div>";

// delete bubble/comment form
delForm =	"<form class='deleteForm pull-right' name='delcomment'>" +
				"<input id='commentId' type='hidden' name='commentId'>" +
				"<button class='btn btn-default btn-xs' type='submit' title='Delete Bubble'>" +
					"<span class='glyphicon glyphicon-remove'></span>" +
				"</button>" +
			"</form>";

delPrefix = "<form class='deleteForm pull-right' name='delcomment'>" +
				"<input id='commentId' type='hidden' name='commentId' value='";

delSuffix = "'>" +
			"<button class='btn btn-default btn-xs' type='submit' title='Delete Comment'>" +
				"<span class='glyphicon glyphicon-remove'></span>" +
			"</button></form>";

// close bubble form
closeBubbleForm = "<div class='pull-right'><button class='btn btn-default btn-xs closeBubble' type='submit' title='Close Bubble'>" +
					"<span class='glyphicon glyphicon-minus'></span>" +
				  "</button></div>";

// edit button
editPrefix = "<form class='editButtonForm' name='editcomment'>" +
				"<button class='btn btn-danger btn-xs editButton' type='submit' title='Edit'>edit</button> " +
			 	"<button style='display:none' class='btn btn-danger btn-xs cancelEditButton' type='submit' title='Cancel'>cancel</button>" +
			 	"<input id='commentId' type='hidden' name='commentId' value='";
editSuffix = "'></form>";

// constructor
function CommentTree(properties) {
	this.structure = properties;
}

// display the comments
CommentTree.prototype.displayComments = function() {

	var tree = this.structure;

	var treeString = { ts: '' };

	treeString.ts += groupPrefix;

	if (tree) {

		// sort bubbles by time created
		tree.bubbles.sort(sort_by('timeCreated', true, moment));

		// iterate through each bubble
		for (i in tree.bubbles) {

			// traverse all comment nodes
			generateTreeStructure(tree.bubbles[i], treeString);
		}
	}

	treeString.ts += groupSuffix;
	treeString.ts += replyForm;

	return treeString.ts;
}

// create new IDs for all comments/bubbles
CommentTree.prototype.addIDs = function() {

	var tree = this.structure;

	this.structure._id = new ObjectID();

	for (i in tree.bubbles) {

		addID(tree.bubbles[i]);

		traverse(tree.bubbles[i], addID);
	}

}

// return JSON structure of the comment tree
CommentTree.prototype.getStructure = function() {

	return this.structure;
}

// add bubble to the comment tree
CommentTree.prototype.addBubble = function(bubbleN) {

	var tree = this.structure;

	// if tree isn't created, create one
	if (!this.structure) {
		console.log("Creating tree...");
		this.structure = { bubbles: [] };
	}

	// if list of bubbles not created, create it
	if (!this.structure.bubbles) {
		console.log("Creating list of bubbles...");
		this.structure.bubbles = [];
	}

	var tree = this.structure;

	// sanitize bubble name
	var cleanBubbleName = sanitizeHtml(bubbleN,  { allowedTags: []});

	tree.bubbles.push({ bubbleName : cleanBubbleName, points : 0, timeCreated : new Date(), children : [], id : new ObjectID()});
}

// add comment to the comment tree given its parent
CommentTree.prototype.addComment = function(commentContent, parent) {

	var tree = this.structure;

	for (i in tree.bubbles) {

		//checkParent(tree.bubbles[i], commentContent, parent);

		traverseAdd(tree.bubbles[i], checkParent, commentContent, parent);
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
function checkParent(node, commentContent, parent) {
	
	// if node matches parent id, add the comment to children
	if (node.id == parent) {

		// sanitize comment content
		console.log(commentContent);
		var cleanComment = sanitizeHtml(commentContent);

		node.children.push({ author : "ANON", points : 0, timeCreated : new Date().toISOString(), 
							 timeLastEdited : new Date().toISOString(), comment : cleanComment, 
							 children : [], id : new ObjectID()});
	}
}

// create new ID for individual node
function addID(node) {
	node.id = new ObjectID();
}

// traverse nodes, applying the function and args provided
function traverseAdd(node, fn, commentContent, parent) {
	fn(node, commentContent, parent);

	for (i in node.children) {
		traverseAdd(node.children[i], fn, commentContent, parent);
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
function generateTreeStructure(node, treeString) {

	if (node.bubbleName)
		treeString.ts += bubbleNamePrefix
	else
		treeString.ts += commentPrefix

	treeString.ts += getDeleteCommentForm(node);

	if (node.bubbleName)
		treeString.ts += closeBubbleForm;

	treeString.ts += getTimeFromNow(node);

	if (node.bubbleName)
		treeString.ts += "<div class='bubbleText'>" + node.bubbleName + "</div>" + bubbleNameSuffix;
	else
		treeString.ts += "<div class='commentText'>" + node.comment + "</div>";

	if (!node.bubbleName) {
		// add last edited time if it differs from time created for comments
		treeString.ts += getTimeLastEdited(node);

		// add edit button form for comments
		treeString.ts += getEditCommentForm(node);
	}

	// add reply form
	treeString.ts += getReplyForm(node);

	treeString.ts += groupPrefix;

	// sort children comments by time created
	node.children.sort(sort_by('timeCreated', true, moment));

	for (var i = 0; i < node.children.length; i++) {
		generateTreeStructure(node.children[i], treeString);
	}

	treeString.ts += groupSuffix;
	
	treeString.ts += itemSuffix;
}

// return the time that the node was created relative to now
function getTimeFromNow(node) {
	return "<span class='timeCreated pull-right'>" + moment(node.timeCreated).fromNow() + "</span>";
}

// return the time last edited
function getTimeLastEdited(node) {

	// display time last edited if it differs from time created
	if (node.timeLastEdited && moment(node.timeLastEdited).fromNow() != moment(node.timeCreated).fromNow())
		return "<span class='timeLastEdited'>last edited " + moment(node.timeLastEdited).fromNow() + "</span>";
	return "";
}

// add in comment id into delete comment form
function getDeleteCommentForm(node) {

	if (!node.id)
		return delForm;

	return delPrefix + node.id + delSuffix;
}

// add in comment id into edit comment form
function getEditCommentForm(node) {
	return editPrefix + node.id + editSuffix;
}

// add in parent comment id into comment form
function getReplyForm(node) {

	if (!node.id)
		return replyForm;

	return replyPrefix + node.id + replySuffix;
}

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