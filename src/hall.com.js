//
// NB: FF version use MutationObserver
//
$(function() {
	// my styles / fixes
	var style = [];
	style.push('textarea:-moz-placeholder { color: #ADB6BF !important; }');
	style.push('li.hr { border-bottom: 2px solid #999; opacity: 0.2 }');
	style.push('li.b4 { opacity: 0.2; }');
	style.push('li.current_user { background-color: rgba(82,168,236,0.08); }');
	style.push('span.curr { background-color: rgba(255, 31, 63, 0.2); border-radius: 3px; }');
	style.push('span.user { background-color: rgba(123, 123, 123, 0.2); border-radius: 3px; }');
	$("head").append("<style>" + style.join("") + "</style>");


	/**
	 *
	 * when you click on the <time> it passes the parent li here
	 * if the hash == time - clear
	 * else make the li's above the time fade
	 *
	 */
	var li_handler = function(li) {
		var found = $(".hr").removeClass("hr b4").length;
		var hash = "#"+ li.data("id");

		// click again to clear
		if (window.location.hash == hash && found) {
			window.location.hash = "";
			li.siblings().removeClass("b4");
		}
		else if (li.length) {
			window.location.hash = hash;
			li.addClass("hr").siblings()
				.filter(":lt("+ li.index() +")").addClass("b4")
					.end()
				.filter(":gt("+ li.index() +")").removeClass("b4")
					.end()
				.end();
		}
	};


	/**
	 *
	 * when new li's show up this parses the users in the msg div
	 *
	 */
	var li_parse_user = function(li) {
		var msg = $(li).find("div.msg:not(.lpu)");
		var msg_html = msg.html();
		var re_current = $.fn.re_current_user || {};
		var re_user = $.fn.re_current_users || {};

		if ("test" in re_current && re_current.test(msg_html)) {
			msg_html = msg_html.replace(re_current, "<span class='curr'>$1</span>");
			msg.html(msg_html).addClass("lpu");
		}
		if ("test" in re_user && re_user.test(msg_html)) {
			msg_html = msg_html.replace(re_user, "<span class='user'>$1</span>")
			msg.html(msg_html).addClass("lpu");
		}
	};


	/**
	 *
	 * DOM watcher listening for new LI's ~ allways on
	 *
	 */
	var ol_watch = function() {
		var observer = new WebKitMutationObserver(function(mutations, observer) {
			// fired when a mutation occurs
			for (var i=0,n=mutations.length; i<n; i++) {
				var mutt = mutations[i];
				if (mutt.type == "childList" && mutt.addedNodes.length > 0) {
					for (var j=0,m=mutt.addedNodes.length; j<m; j++) {
						var node = mutt.addedNodes[j];
						li_parse_user(node);
					}
				}
			}
		});

		// define what element should be observed by the observer
		// and what types of mutations trigger the callback
		observer.observe( $(".hall-listview-viewport").get(0).childNodes[0], {
			subtree: false,
			childList: true,
			attributes: false,
			characterData: false,
			attributeOldValue: false,
			characterDataOldValue: false
			//...
		});
	};


	/**
	 *
	 * At startup we need to find the LI's so we can parse them
	 * Also we can find the Members and add them to the jQuery scope
	 *
	 * This one we turn off as soon as the chat/memebers are loaded
	 */
	var document_watch = function() {
		var _chat = false;
		var _members = false;
		var _nodes = [];

		// used jsmin to minimize this method ... too many if / if / if
		var _disconnect = function(observer) {
			if (_chat && _members && (observer.disconnect(), _nodes.length)) {
				for (var hash = window.location.hash ? ("" + window.location.hash).substring(1) : null, li; li = _nodes.pop();) {
					li_parse_user(li);
					hash && (li = $(li), li.data("id") == hash && li_handler(li));
				}
			}
		};

		var _observer = new WebKitMutationObserver(function(mutations, observer) {
			for (var i=0,n=mutations.length; i<n; i++) {
				var mutt = mutations[i];
				if (mutt.type == "childList" && mutt.addedNodes.length > 0) {
					if (mutt.target.nodeName == "OL") {
						if (mutt.target.className.match(/hall-listview-chat/)) {
							_chat = true;
							_disconnect(observer); // want to do this early

							// add all the new messages so we can parse them
							for (var j=0,m=mutt.addedNodes.length; j<m; j++) {
								var node = mutt.addedNodes[j];
								if (node.nodeName == "LI") {
									_nodes.push(node);
								}
							}

							// watch the chat messages for new ones (or old ones)
							ol_watch();

						}
						else if (mutt.target.className.match(/hall-listview-members/)) {
							_members = true;
							_disconnect(observer);

							var current_user = $.trim($("li[data-hall-user-card]:not([data-route])", mutt.target).text());
							$.fn.current_user = current_user;
							$.fn.re_current_user = new RegExp("([@]?(?:" + current_user + "|" + current_user.replace(/[ ]+/g, "|") + "))", "gi");

							// look for all the user names
							var current_users = [];
							var re_array = [];
							for (var j=0,m=mutt.addedNodes.length; j<m; j++) {
								var node = mutt.addedNodes[j];
								if (node.nodeName == "LI") {
									var user = $.trim($(node).text());
									if (user != current_user) {
										current_users.push(user);
										re_array.push(user, user.replace(/[ ]+/g, "|"));
									}
								}
							}
							$.fn.current_users = current_users;
							$.fn.re_current_users = new RegExp("([@]?(?:" + re_array.join("|")  + "))", "gi");
						}
					}
				}
			}
			_disconnect(observer);
		});

		_observer.observe( document, {
			subtree: true,
			childList: true,
			attributes: false,
			characterData: false,
			attributeOldValue: false,
			characterDataOldValue: false
			//...
		});
	};
	document_watch();


	/**
	 *
	 * document click events ...
	 *
	 */
	$(document)
		.on("click", "time", function(e) {
			li_handler( $(e.currentTarget).closest("li.hall-listview-li") );
		})
		.on("click", "li[data-hall-user-card]:not([data-route])", function(e) {
			//
			// clicked on the current user
			//
		});
});
