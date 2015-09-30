/**
*	Author: Jacob Abramson
*	Date: 9/20/2015
*
*	HTML elements are accessible and modifiable from this class
*/

var moment = require('moment');

// constructor
function Elements() {}

Elements.prototype.getBubbleItemPrefix = function(node) {
	return BUBBLE_ITEM_PREFIX + node.id + END_TAG;
}

Elements.prototype.getCommentItemPrefix = function(node) {
	return COMMENT_ITEM_PREFIX + node.id + END_TAG;
}

Elements.prototype.getItemSuffix = function() {
	return ITEM_SUFFIX;
}

Elements.prototype.getGroupPrefix = function() {
	return GROUP_PREFIX;
}

Elements.prototype.getGroupSuffix = function() {
	return GROUP_SUFFIX;
}

Elements.prototype.getBubbleText = function(str) {
	return BUBBLE_TEXT_PREFIX + str + BUBBLE_TEXT_SUFFIX;
}

Elements.prototype.getCommentText = function(str) {
	return COMMENT_TEXT_PREFIX + str + COMMENT_TEXT_SUFFIX;
}

// return the reply box along with parent comment id if provided
Elements.prototype.getReplyForm = function(obj) {
	if (typeof obj === 'undefined' || !obj.id)
		return REPLY_FORM;
	return REPLY_PREFIX + obj.id + REPLY_SUFFIX;
}

// return delete form along with comment id if provided
Elements.prototype.getDeleteForm = function(obj) {
	return DEL_PREFIX + obj.id + DEL_SUFFIX;
}

// return the minimize bubble form/button
Elements.prototype.getCloseBubbleForm = function() {
	return CLOSE_BUBBLE_FORM;
}

// return the edit form/button along with its respective comment id
Elements.prototype.getEditForm = function(obj) {
	return EDIT_PREFIX + obj.id + EDIT_SUFFIX;
}

// return the share button along with its respective comment id
Elements.prototype.getShareButton = function(obj) {
	return SHARE_PREFIX + obj.id + SHARE_SUFFIX;
}

Elements.prototype.getTimestamp = function(obj) {
	return TIME_PREFIX + moment(obj.timeCreated).fromNow() + TIME_SUFFIX;
}

Elements.prototype.getEditTimestamp = function(obj) {
	if (typeof obj === 'undefined' || !obj.timeLastEdited)
		return EDIT_TIME_PREFIX + EDIT_TIME_SUFFIX;
	return EDIT_TIME_PREFIX + EDIT_TIME_STRING + moment(obj.timeLastEdited).fromNow() + EDIT_TIME_SUFFIX;
}

END_TAG = "'>";

BUBBLE_ITEM_PREFIX = "<li class='list-group-item bubbleItem bubbleClosed' id='";
COMMENT_ITEM_PREFIX = "<li class='list-group-item' id='";
ITEM_SUFFIX = "</li>";

GROUP_PREFIX = "<ul class='list-group'>";
GROUP_SUFFIX = "</ul>";

BUBBLE_TEXT_PREFIX = "<div class='bubbleText'>";
BUBBLE_TEXT_SUFFIX = "</div>";

COMMENT_TEXT_PREFIX = "<div class='commentText'>";
COMMENT_TEXT_SUFFIX = "</div>"; 

REPLY_PREFIX = "<form class='addCommentForm' name='addcomment' id='addCommentForm'>" +
				"<div class='input-group'>" +
					"<input class='form-control oneLine' required type='text' placeholder='Reply!' name='commentContent'>" +
					"<textarea style='display:none' rows='4' disabled class='form-control commentContent multiLine' placeholder='Reply!' name='commentContent'></textarea>" +
					"<input class='form-control' type='hidden' name='parent' value='";

REPLY_SUFFIX = "'>" +
					"<span class='input-group-btn'>" +
						"<button class='btn btn-danger expandButton' type='button' title='Expand'>+</button>" +
						"<button class='btn btn-danger submitButton' type='submit' title='Submit Comment'>submit</button>" +
					"</span>" +
				"</div></form>";

REPLY_FORM = "<form class='addCommentForm' name='addcomment' id='addCommentForm'>" +
				"<div class='input-group'>" +
					"<input class='form-control' required id='commentContent' type='text' placeholder='Add Bubble!' name='commentContent'>" +
					"<input class='form-control' id='parent' type='hidden' name='parent'>" +
					"<span class='input-group-btn'>" +
						"<button class='btn btn-danger submitButton' type='submit' title='Add Bubble'>add</button>" +
					"</span>" +
				"</div></form>";

DEL_PREFIX = "<form class='deleteForm pull-right' name='delcomment'>" +
				"<input id='commentId' type='hidden' name='commentId' value='";

DEL_SUFFIX = "'>" +
			"<button class='btn btn-default btn-xs' type='submit' title='Delete Comment'>" +
				"<span class='glyphicon glyphicon-remove'></span>" +
			"</button></form>";

// close bubble form
CLOSE_BUBBLE_FORM = "<div class='pull-right'><button class='btn btn-default btn-xs closeBubble' type='submit' title='Close Bubble'>" +
					"<span class='glyphicon glyphicon-minus'></span>" +
				  "</button></div>";

// edit button
EDIT_PREFIX = "<form class='editButtonForm' name='editcomment'>" +
				"<button class='btn btn-danger btn-xs editButton' type='submit' title='Edit'>edit</button> " +
			 	"<button style='display:none' class='btn btn-danger btn-xs cancelEditButton' type='submit' title='Cancel'>cancel</button> " +
			 	"<input id='commentId' type='hidden' name='commentId' value='";
EDIT_SUFFIX = "'></form>";

SHARE_PREFIX = "<a class='btn btn-danger btn-xs shareButton' href='?commentId=";
SHARE_SUFFIX = "'>share</a>"

TIME_PREFIX = "<span class='timeCreated pull-right'>";
TIME_SUFFIX = "</span>";

EDIT_TIME_PREFIX = "<span class='timeLastEdited'>";
EDIT_TIME_SUFFIX = "</span>";
EDIT_TIME_STRING = "last edited ";

module.exports = Elements;