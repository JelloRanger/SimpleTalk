/**
*	Author: Jacob Abramson
*	Date: 8/3/2015
*
*	An implementation of a tree with multiple children per node
*/

// imports
var ObjectID = require('mongodb').ObjectID;

// prefix/suffix for bubble name/comment items
bubbleNamePrefix = "<li class='list-group-item'>";
commentPrefix = "<li class='list-group-item'>";
itemSuffix = "</li>";

groupPrefix = "<ul class='list-group'>";
groupSuffix = "</ul>";

// reply form along with prefix/suffix for appending parents
replyForm = "<form name='addcomment' method='post' action='/addComment'>" +
				"<div class='input-group'>" +
					"<input class='form-control' type='text' placeholder='Comment!' name='commentContent'>" +
					"<input class='form-control' type='hidden' name='parent' value='none'>" +
					"<span class='input-group-btn'>" +
						"<button class='btn btn-primary' type='submit'>submit</button>" +
					"</span>" +
				"</div>" +
			"</form>";

replyPrefix = "<form name='addcomment' method='post' action='/addComment'>" +
				"<div class='input-group'>" +
					"<input class='form-control' type='text' placeholder='Comment!' name='commentContent'>" +
					"<input class='form-control' type='hidden' name='parent' value='";
replySuffix = "'>" +
					"<span class='input-group-btn'>" +
						"<button class='btn btn-primary' type='submit'>submit</button>" +
					"</span>" +
				"</div>" +
			"</form>";


// constructor
function CommentTree(properties) {
	this.structure = properties;
}

// display the comments
CommentTree.prototype.displayComments = function() {

	var tree = this.structure;

	var treeString = { ts: '' };

	// iterate through each bubble
	for (i in tree.bubbles) {

		if (i == 0)
			treeString.ts += groupPrefix;

		// traverse all comment nodes
		generateTreeStructure(tree.bubbles[i], treeString);

		if (i == tree.bubbles.length - 1)
			treeString.ts += groupSuffix;
	}

	return treeString.ts;
}

// create new IDs for all comments/bubbles
CommentTree.prototype.addIDs = function() {

	var tree = this.structure;

	for (i in tree.bubbles) {

		addID(tree.bubbles[i]);

		traverse(tree.bubbles[i], addID);
	}

}

// create new ID for individual node
function addID(node) {
	node.id = new ObjectID();
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
		treeString.ts += bubbleNamePrefix + node.bubbleName;
	else
		treeString.ts += commentPrefix + node.comment;

	for (var i = 0; i < node.children.length; i++) {

		if (i == 0)
			treeString.ts += groupPrefix;

		generateTreeStructure(node.children[i], treeString);

		if (i == node.children.length - 1)
			treeString.ts += groupSuffix + getReplyForm(node);
	}
	
	treeString.ts += itemSuffix;
}

// add in parent comment id into comment form
function getReplyForm(node) {

	if (!node.id)
		return replyForm;

	return replyPrefix + node.id + replySuffix;
}

module.exports = CommentTree;