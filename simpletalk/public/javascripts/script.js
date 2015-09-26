$(document).ready(function() {

	// hide all bubble contents on page load
	/*var displayed_class = $.cookie('displayedClass');
	alert(displayed_class);
	if (!displayed_class)
		$('.bubbleItem').children().hide();*/

	// grab the commentID if provided
	var commentID = getUrlParameter('commentId');

	// scroll to the comment specified by its id if available
	if (commentID && $("#" + commentID).length > 0) {
		$('html, body').animate({
			scrollTop: $("#" + commentID).offset().top
		}, 0);
	}

	// grab comment ID from url parameter
	function getUrlParameter(paramName) {
		var url = decodeURIComponent(window.location.search.substring(1)),
				  URLVars = url.split('&'),
				  param,
				  i;

		for (i = 0; i < URLVars.length; i++) {
			param = URLVars[i].split('=');

			if (param[0] === paramName)
				return param[1] === undefined ? true : param[1];
		}
	}

	// expand the text input field to a textarea and vice versa
	$('.expandButton').click(function() {

		// grab input text field and textarae
		var inputTextField = $(this).closest('form').find('input[type=text]');
		var textareaField = $(this).closest('form').find('textarea');

		// toggle between input text field and textarea
		inputTextField.toggle();
		textareaField.toggle();

		// alter required/disabled attributes based on which field is being displayed
		if (inputTextField.attr("required")) {
			inputTextField.removeAttr("required");
			inputTextField.attr("disabled", true);
			textareaField.attr("required", true);
			textareaField.removeAttr("disabled");

			// convert <br> tags to line breaks
			textareaField.val(inputTextField.val().replace(/<br\s*[\/]?>/gi, '\n'));

			$(this).html("-");
		}
		else {
			textareaField.removeAttr("required");
			textareaField.attr("disabled", true);
			inputTextField.attr("required", true);
			inputTextField.removeAttr("disabled");

			// preserve line breaks with <br> tags
			inputTextField.val(textareaField.val().replace(/\n/g, '<br/>'));

			$(this).html("+");
		}
	});

	// open bubble's content upon clicking the bubble item
	$('.bubbleItem').click(function() {
		$(this).removeClass('bubbleClosed');
		$(this).children().slideDown();
	});

	// close bubble on button click
	$('.closeBubble').click(function(e) {
		e.stopImmediatePropagation();
		$(this).parent().parent().children(':not(.bubbleText)').slideUp();
		$(this).parent().parent().addClass('bubbleClosed');
	});

	// edit comment
	$('.editButton').click(function(e) {
		e.preventDefault();
		
		// grab the current comment content
		var commentTextElement = $(this).parent().parent().children('.commentText');

		// open edit box
		if ($(this).text() == 'edit') {
			
			// change button to submit
			$(this).text('save');

			// add textarea for comment editing and hide current comment content
			commentTextElement.hide();
			commentTextElement.after("<textarea class='editCommentArea'>" + 
				commentTextElement.html().replace(/<br\s*[\/]?>/gi, '\n') + "</textarea>"); // replace <br> with new lines

			// make the cancel button visible
			$(this).next('.cancelEditButton').show();
		}

		// submit edited comment
		else {

			// grab textarea containing edited text
			var revisedCommentText = $(this).parent().parent().children('.editCommentArea');


			// compare current comment text to updated text, if the same don't bother contacting server
			if (revisedCommentText.val() != commentTextElement.html()) {

				// send the updated content along with the comment id to the backend
				var data = {
					text: revisedCommentText.val(),
					commentId: revisedCommentText.siblings('.editButtonForm').children('#commentId').val()
				}

				$.ajax({
					type: "POST",
					url: "/editcomment",
					data: data,
					success: function() {

						// the backend has updated the comment
						// update the comment on the client side if no HTML sanitization required
						var checkForHTML = $("<div/>").html(revisedCommentText.val()).text();

						// if the lengths are the same, then no HTML tags are present and no HTML sanitization is required
						// thus, we can simply update the comment on the page without a refresh
						if (revisedCommentText.val().length == checkForHTML.length) {
							commentTextElement.text(revisedCommentText.val());

							// display 'last edited a few seconds ago' to let user know the edit went through
							commentTextElement.siblings('.timeLastEdited').text("last edited a few seconds ago");
						}

						// otherwise, refresh the page, so we can display the sanitized HTML
						else {
							window.location.reload();
						}
					},
					error: function() {
						console.log("Error: Unable to update comment from server");
					}
				});
			}
			
			// hide edit textarea, show (updated) comment text
			commentTextElement.show();
			revisedCommentText.remove();

			// submission complete, change button name to edit, hide cancel button
			$(this).text('edit');
			$(this).next('.cancelEditButton').hide();
		}
	});

	// cancel editing a comment
	$('.cancelEditButton').click(function(e) {
		e.preventDefault();

		// show comment text, remove edit textarea, rename save button to edit, and hide this button
		$(this).parent().siblings('.commentText').show();
		$(this).parent().siblings('.editCommentArea').remove();
		$(this).siblings('.editButton').text('edit');
		$(this).hide();
	});

	function isScrolledIntoView(elem)
	{
	    var $elem = $(elem);
	    var $window = $(window);

	    var docViewTop = $window.scrollTop();
	    var docViewBottom = docViewTop + $window.height();

	    var elemTop = $elem.offset().top;
	    var elemBottom = elemTop + $elem.height();

	    return ((( elemTop >= docViewTop) && (elemTop <= docViewBottom)) || 
	    		((elemBottom >= docViewTop) && (elemBottom <= docViewBottom)));
	}

	// submit an ajax post request for adding a comment/bubble
	$('.addCommentForm').submit(function(e) {

		// prevent regular form submission
		e.preventDefault();

		var commentElem = $(this).parent();

		// keep track of the position of the parent comment
		var parentPos = $(this).parent().parent().offset().top;

		$.ajax({
			type: "POST",
			url: "/addcomment",
			data: $(this).serialize(),
			success: function(data) {

				// if new comment would appear outside of current viewport, move scrollbar
				// to location of the new comment
				// TODO: Currently only works if new comment is ABOVE viewport, not below
				//if (!(((parentvar + $(parentvar).height()) <= $(window).scrollTop() + $(window).height()) &&
					//($(parentvar).offset().top >= $(window).scrollTop()))) {
				/*if (!isScrolledIntoView(commentElem)) {
					$('html, body').animate({
						scrollTop: commentElem.offset().top
					}, 0, function() {
						window.location = window.location.pathname;
						//window.location.reload();
					});
				}

				// otherwise just refresh the page since the new comment is in the viewport
				else {
					window.location = window.location.pathname;
					//window.location.reload();
				}*/

				var urlComment = window.location.pathname;
				if (!($(commentElem).attr('id') === undefined)) {
					console.log("werehere");
					urlComment += "?commentId=" + $(commentElem).attr('id');
				}
				window.location.href = urlComment;

			},
			error: function(e) {
				console.log("Error: Unable to send data to server");
			}
		});

		// guarantee input text field and text area are cleared
		$(this).closest('form').find("input[type=text]").val("");
		$(this).closest('form').find("textarea").val("");

		// guarantee input text field is not disabled
		$(this).closest('form').find("input[type=text]").removeAttr('disabled');
	});

	// submit an ajax post request for deleting a comment/bubble
	// (this allows us to delete comments without a page refresh)
	$('.deleteForm').submit(function(e) {

		// prevent regular form submission
		e.preventDefault();

		var deleteMe = $(this);

		$.ajax({
			type: "POST",
			url: "/delcomment",
			data: $(this).serialize(),
			success: function(data) {

				// the backend has deleted the comment
				// remove the comment on the client side
				deleteMe.parent('li').remove();
			},
			error: function(e) {
				alert("error");
			}
		});
	});
});