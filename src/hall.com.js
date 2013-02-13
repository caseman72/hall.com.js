//
// NB: FF version use MutationObserver
//
$(function() {
	/*
	// my styles / fixes
	var style = [];
	style.push('textarea:-moz-placeholder { color: #ADB6BF !important; }');
	style.push('li.hr { border-bottom: 2px solid #999; opacity: 0.2 }');
	style.push('li.b4 { opacity: 0.2; }');
	style.push('li.current_user { background-color: rgba(82,168,236,0.08); }');
	style.push('span.curr { background-color: rgba(255, 31, 63, 0.2); border-radius: 3px; }');
	style.push('span.user { background-color: rgba(123, 123, 123, 0.2); border-radius: 3px; }');

	style.push('.sh_typical {background:none; padding:0; margin:0; border:0 none;}');
	style.push('.sh_typical .sh_sourceCode {background-color:#f6f6f6;color:#000;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_keyword {color:#00c;font-weight:bold;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_type {color:#00c;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_string {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_regexp {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_specialchar {color:#C42DA8;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_comment {color:#0c0;font-weight:normal;font-style:italic;}');
	style.push('.sh_typical .sh_sourceCode .sh_number {color:#a900a9;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_preproc {color:#666;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_symbol {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_function {color:#000;font-weight:bold;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_cbracket {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_url {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_date {color:#00c;font-weight:bold;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_time {color:#00c;font-weight:bold;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_file {color:#00c;font-weight:bold;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_ip {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_name {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_variable {color:#ec7f15;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_oldfile {color:#C42DA8;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_newfile {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_difflines {color:#00c;font-weight:bold;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_selector {color:#ec7f15;font-weight:normal;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_property {color:#00c;font-weight:bold;font-style:normal;}');
	style.push('.sh_typical .sh_sourceCode .sh_value {color:#c00;font-weight:normal;font-style:normal;}');
	style.push('.snippet-wrap .snippet-menu pre, .snippet-wrap .snippet-hide pre {background-color:transparent; margin:0; padding:0;}');
	style.push('.snippet-wrap .snippet-menu a, .snippet-wrap .snippet-hide a {padding:0 5px; text-decoration:underline;}');
	style.push('.snippet-wrap pre.sh_sourceCode {padding:0;line-height:1.5em;overflow:auto;position:relative;-moz-border-radius: 5px;-webkit-border-radius: 5px;border-radius: 5px;border: 1px dotted #999}');
	style.push('.snippet-wrap .snippet-no-num {list-style:none; padding:.2em 0.5em; margin:0;}');
	style.push('.snippet-wrap .snippet-no-num li {list-style:none; padding-left:0;}');
	style.push('.snippet-wrap .snippet-num li {padding-left:1.5em;}');
	style.push('.snippet-wrap .snippet-num {margin:0; padding-left:3em;}');
	style.push('.snippet-wrap .snippet-num li {list-style:decimal-leading-zero outside none;}');

	$("head").append("<style>\n" + style.join("\n") + "\n</style>");
	*/


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
		var re_current = $.fn.re_current_user || {};
		var re_user = $.fn.re_current_users || {};
		var msg = $(li).find("div.msg:not(.lpu)");
		var msg_html = msg.html();
		if (msg_html) {
			if ("test" in re_current && re_current.test(msg_html)) {
				msg_html = msg_html.replace(re_current, "<span class='curr'>$1</span>");
				msg.html(msg_html).addClass("lpu");
			}
			if ("test" in re_user && re_user.test(msg_html)) {
				msg_html = msg_html.replace(re_user, "<span class='user'>$1</span>")
				msg.html(msg_html).addClass("lpu");
			}

			var re_source_code = $.fn.re_source_code;
			var srcs = {};
			var changed = false;
			var parts;
			if ("test" in re_source_code) {
				while (parts = re_source_code.exec(msg_html)) {
					msg_html = msg_html.replace(re_source_code, '<pre class="'+ (parts[1] || "js") +'">'+ parts[2] +'</pre>');
					srcs[(parts[1] || "js")] = true;
					changed = true;
				}
				if (changed) {
					msg.html(msg_html);
					for (src in srcs) {
						msg.find("pre."+src).snippet(src, {style:"typical", showNum: ((msg_html.match(/\n/g)||[]).length > 7)}); // phone numbers are 7 digits ~ most a person can remember
					}
				}
			}
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

							// look for all the user names
							var current_user = [];
							var current_users = [];
							for (var j=0,m=mutt.addedNodes.length; j<m; j++) {
								var node = mutt.addedNodes[j];
								if (node.nodeName == "LI") {
									var li = $(node);
									var user = $.trim(li.find("span[data-hall-user-id]").text());
									if (user) {
										if (li.attr("data-route")) {
											current_users.push(user, user.replace(/[ ]+/g, "|"));
										}
										else {
											current_user.push(user, user.replace(/[ ]+/g, "|"));
										}
									}
								}
							}
							// pass to global scope
							$.fn.re_current_users = new RegExp("([@]?(?:" + current_users.join("|")  + "))", "gi");
							$.fn.re_current_user = new RegExp("([@]?(?:" + current_user.join("|") + "))", "gi");
							$.fn.re_source_code = /(^|html|js|php|sql|xml)\{\{([\s\S]+)\}\}\1?/;

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
		.on("click", "li[data-hall-user-id]:not([data-route])", function(e) {
			//
			// clicked on the current user
			//
		});
});
