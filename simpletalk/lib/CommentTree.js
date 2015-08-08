/**
*	Author: Jacob Abramson
*	Date: 8/3/2015
*
*	An implementation of a tree with multiple children per node
*/

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
			treeString.ts += "<ul class='list-group'>";

		// traverse all comment nodes
		traverse2(tree.bubbles[i], "", treeString);
		//treeString.ts += "</ul>"

		if (i == tree.bubbles.length - 1)
			treeString.ts += "</ul>";
	}

	return treeString.ts;// += "</ul>";
}

function traverse(node, indent, treeString) {
	if (node.bubbleName)
		treeString.ts += indent + node.bubbleName + "\n";
	else
		treeString.ts += indent + node.comment + "\n";
	for (i in node.children) {
		traverse(node.children[i], indent + "--", treeString);
	}
}

function traverse2(node, indent, treeString) {

	if (node.bubbleName)
		treeString.ts += "<li class='list-group-item'>" + indent + node.bubbleName;
	else
		treeString.ts += "<li class='list-group-item'>" + indent + node.comment;

	for (var i = 0; i < node.children.length; i++) {

		if (i == 0)
			treeString.ts += "<ul class='list-group'>";

		traverse2(node.children[i], indent + "--", treeString);

		if (i == node.children.length - 1)
			treeString.ts += "</ul>";
	}
	
	treeString.ts += "</li>";
}

module.exports = CommentTree;