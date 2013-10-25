//
// NB: FF version use MutationObserver
//
$(function() {
	/**
	 * global object to store hall specific items in
	 */
	$.hall_object = {
		// regexes
		re_current: {test: function() { return false; }},
		re_user: {test: function() { return false; }},
		re_source: /^(?:<code>)?(?:\/(code|html|css|js|php|sql|xml))([\s\S]+)(?:<\/code>)?/,
		re_status: /^(?:<code>)?(?:\/(here|available|away|gone|brb|out|l8r|dnd|busy))([\s\S]*)(?:<\/code>)?/,
		re_table: /\n?(?:[-]{4,}[+])+(?:[<\n])/,
		re_hex: /(^|[^\B\/"'>])(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}|rgba?\(.*?\))([^\B"'<]|$)/g,
		re_bug: /(^|[^\B\/"'>])(vis|ar|hd)[-]([0-9]+)([^\B"'<]|$)/gi,
		re_me: /(^|[^\B\/"'>])\/me([^\B"'<]|$)/g,
		re_hr: /\n?[-]{10,}([<\n])/g,
		// hashes
		ols: {},
		bots: {},
		rooms: {},
		current_user: {},
		current_users: {},
		// states
		states: {
			init: 0,
			running: 1,
			done: 2
		}
	};

	/**
	 * when you click on the <time> it passes the parent li here
	 * if the hash == time - clear
	 * else make the li's above the time fade
	 */
	var li_handler = function($li) {
		var found = $(".hr").removeClass("hr b4").length;
		var hash = "#"+ $li.data("id");

		if (found && window.location.hash === hash) {
			// click again to clear
			window.location.hash = "";
			$li.siblings().removeClass("b4");
		}
		else if ($li.length) {
			// click to set
			window.location.hash = hash;
			$li.addClass("hr")
				.siblings()
					.filter(":lt("+ $li.index() +")").addClass("b4").end()
					.filter(":gt("+ $li.index() +")").removeClass("b4").end();
		}
	};


	/**
	 * check to see if all rooms are processed
	 */
	var rooms_done = function() {
		var $options = $.hall_object;

		// if no keys - not done
		var all_done = Object.keys($options.rooms).length > 0;
		for (var id in $options.rooms) {
			all_done = all_done && $options.rooms[id] === $options.states.done;
		}

		return all_done;
	};

	/**
	 * update status via ajax - only for time.localtime (right now)
	 */
	var update_status = function(status, message) {
		status = $.trim(status || "available").toLowerCase();
		message = $.trim(message || "");

		// abbreviations
		if (-1 !== $.inArray(status, ["available", "here"])) {
			status = "available";
		}
		else if (-1 !== $.inArray(status, ["away", "gone", "brb", "out", "l8r"])) {
			status = "away";
		}
		else if (-1 !== $.inArray(status, ["busy", "dnd"])) {
			status = "dnd";
		}

		// update status
		$.ajax({
			type: "POST",
			data: {status: status, message: message},
			headers: {
				"X-CSRF-Token": $.trim($("meta[name='csrf-token']").attr("content"))
			},
			url: "https://hall.com/api/1/user_statuses"
		});
	};


	/**
	 * create regext each time ...
	 */
	var get_user_regex = function(collection) {
		// base function that fails all tests
		var regex = {test: function() { return false; }};

		// collection has values
		if (Object.keys(collection).length) {
			var list = [];
			for (var key in collection) {
				list.push(collection[key]);
			}
			// update with list join by 'OR'
			regex = new RegExp("((?:^|[@]|\\b)(?:" + list.join("|")  + "))(?:$|\\b)", "gi");
		}

		return regex;
	};


	/**
	 * parse user data from json requests - when all done re-parse all li's
	 */
	var parse_user_data = function(data) {
		// must be an array ...
		data = (!data || (typeof data.length !== "number")) ? [] : data;

		var current_user = $(".user-settings:first").find(".current-user").find(".fullname").text();

		var $options = $.hall_object;
		for (var i=0,n=data.length; i<n; i++) {
			if ("display_name" in data[i]) {
				var display_name = ""+data[i].display_name;

				// user name logic
				var user = data[i].user;

				// job title is our flag for bots
				if (user.job_title === "git-bot") {
					$options.bots[display_name] = user;
				}
				else {
					if (user.fname && user.lname) {
						if (user.lname.length < 4) {
							user = [display_name, user.fname, user.fname+user.lname[0]].join("|");
						}
						else {
							user = [display_name, display_name.replace(/[ ]+/g, "|"), user.fname+user.lname[0]].join("|");
						}
					}
					else {
						user = display_name;
					}

					// current_user or users
					if (display_name === current_user) {
						if (!(display_name in $options.current_user)) {
							$options.current_user[display_name] = user;
						}
					}
					else if (!(display_name in $options.current_users)) {
						$options.current_users[display_name] = user;
					}
				}
			}
		}

		// update room to processed
		$options.rooms[this.room_id] = $options.states.done;

		// check for all done - parse all if so
		if (rooms_done()) {
			$options.re_current = get_user_regex($options.current_user);
			$options.re_user = get_user_regex($options.current_users);

			li_parse_all();
		}
	};


	/**
	 * parse members from room links
	 */
	var parse_room_links = function() {
		var $options = $.hall_object;

		// this may fail in other instance if :first isn't the main place for members
		var rooms = $(".rooms:first").find("a[data-route^='rooms']");

		// init loop to define all rooms as not-processed
		rooms.each(function(i, elem) {
			var room_id = ($(elem).data("route") || "").replace(/^rooms\/([^\/]+)\/?.*$/, "$1");
			if (room_id) {
				$(elem).data("room-id", room_id);
				if (!(room_id in $options.rooms)) {
					$options.rooms[room_id] = $options.states.init;
				}
			}
		});

		// second loop to 'get' rooms if not-processed
		rooms.each(function(i, elem) {
			var room_id = $(elem).data("room-id");
			if (room_id && (room_id in $options.rooms) && $options.rooms[room_id] === $options.states.init) {
				$options.rooms[room_id] = $options.states.running;
				$.ajax({
					type: "GET",
					url: "https://hall.com/api/1/rooms/groups/" +room_id+ "/room_members?_=" + (new Date().getTime()),
					context: {room_id: room_id} // pass in room_id to be marked as done
				})
				.done(parse_user_data);
			}
		});
	};


	/**
	 * reparse all li's
	 */
	var li_parse_all = function() {
		if (rooms_done()) {
			$(".hall-listview-chat").find("li").each(function(i, li) {
				li_parse_user(li, "li_parse_all");
			});

			// watch the chat messages for new ones (or old ones)
			ol_watch();
		}
		else {
			parse_room_links();
		}
	};


	/**
	 * when new li's show up this parses the users in the msg div
	 *
	 */
	var li_parse_user = function(li) {
		var $options = $.hall_object;

		// this will reparse
		if (!rooms_done()) {
			parse_room_links();
			return false;
		}

		var $li = $(li);
		var msg = $li.find(".msg");
		var time = $li.find("time");
		var cite = $li.find("cite");
		var cite_text = $.trim(cite.text() || "");
		var curr_user = cite_text.match($options.re_current) ? true : false;

		// <Leader>status
		if (curr_user && time.hasClass("localtime")) {
			var status_parts = $options.re_status.exec(msg.html());
			if (status_parts) {
				update_status(status_parts[1], status_parts[2]);
			}
		}
		else if (msg.length && !msg.hasClass("lip")) {
			var msg_html = msg.addClass("lip").html();
			var post_parse = true;

			if (cite.length && !cite.hasClass("gbp")) {
				var cite_text = cite.addClass("gbp").text();

				// <Leader>me
				if ($options.re_me.test(msg_html)) {
					msg_html = msg_html.replace($options.re_me, '$1<span class="'+(curr_user?"curr":"user")+'">'+cite_text+'</span>$2');
					msg.html(msg_html).addClass("me");
					post_parse = false;
				}
				// <Leader>status
				else if ($options.re_status.test(msg_html)) {
					msg_html = msg_html.replace($options.re_status, function(str, p1, p2) {
						p1 = $.trim(p1), p2 = $.trim(p2);
						return '<span class="'+(curr_user?"curr":"user")+'">'+cite_text+'</span> is '+p1+(p2?' says "'+p2+'"':'');
					});
					msg.html(msg_html).addClass("me");
					post_parse = false;
				}
				// robot messages
				else {
					for (var name in $options.bots) {
						if (name === cite_text) {
							$li.addClass("git_bot");
							post_parse = false;
						}
					}
				}
			}

			if (post_parse) {
				// source code
				var re_source = $options.re_source;
				var source_parts = re_source.exec(msg_html);
				if (source_parts) {
					var source_lang = (source_parts[1] == "code" ? "js" : source_parts[1]);
					var line_count = (msg_html.match(/\n/g)||[]).length;

					msg_html = msg_html.replace(re_source, '<pre class="'+ source_lang +'">'+ source_parts[2] +"</pre>");
					msg.html(msg_html)
						.find("pre."+source_lang)
						.snippet(source_lang, {style:"typical", showNum: (line_count > 7)});

					// add some space
					if (line_count > 0) {
						msg.css("padding-right", "50px")
					}
				}
				else {
					var re_current = $options.re_current;
					var re_user = $options.re_user;
					var re_table = $options.re_table;
					var re_hex = $options.re_hex;

					// current
					if (re_current.test(msg_html)) {
						msg_html = msg_html.replace(re_current, "<span class='curr'>$1</span>");
						msg.html(msg_html);
					}
					// users
					else if (re_user.test(msg_html)) {
						msg_html = msg_html.replace(re_user, "<span class='user'>$1</span>");
						msg.html(msg_html);
					}

					// ascii tables
					if (re_table.test(msg_html)) {
						msg.find("code").addClass("fixed-font");
					}
					// hex not in code
					else if (re_hex.test(msg_html)) {
						msg_html = msg_html.replace(re_hex, '$1$2 <span class="hex-preview" style="background-color: $2;">&nbsp;</span>$3');
						msg.html(msg_html);
					}
				}
			}

			// horizontal rules
			var re_hr = $options.re_hr;
			if (re_hr.test(msg_html)) {
				msg_html = msg_html.replace(re_hr, "<hr/>$1");
				msg.html(msg_html);
			}

			// bugs
			var re_bug = $options.re_bug;
			if (re_bug.test(msg_html)) {
				msg_html = msg_html.replace(re_bug, function(str, p1, p2, p3, p4) {
					p2 = p2.toUpperCase();
					return p1+'<a href="http://bugtracker/browse/'+p2+'-'+p3+'" target="_blank">'+p2+'-'+p3+'</a>'+p4;
				});
				msg.html(msg_html);
			}
		}

		return true;
	};


	/**
	 * DOM watcher listening for new LI's ~ allways on
	 */
	var ol_watch = function() {
		var $options = $.hall_object;

		$(".hall-listview-viewport").each(function(i, viewport) {
			// find all viewports and watch them for more messages
			var wrapper_id = $(viewport).parents(".app-page").attr("id");
			if (wrapper_id && !(wrapper_id in $options.ols)) {
				$options.ols[wrapper_id] = true;

				var observer = new WebKitMutationObserver(function(mutations) {
					// fired when a mutation occurs - up top
					for (var i=0,n=mutations.length; i<n; i++) {
						var mutt = mutations[i];
						if (mutt.type === "childList" && mutt.addedNodes.length > 0) {
							for (var j=0,m=mutt.addedNodes.length; j<m; j++) {
								li_parse_user(mutt.addedNodes[j], "ol_watch");
							}
						}
					}
				});

				// define what element should be observed by the observer
				// and what types of mutations trigger the callback
				observer.observe(viewport.childNodes[0], {
					subtree: false,
					childList: true,
					attributes: false,
					characterData: false,
					attributeOldValue: false,
					characterDataOldValue: false
					//...
				});
			}
		});
	};


	/**
	 * At startup we need to find the LI's so we can parse them
	 * Also we can find the Members and add them to the jQuery scope
	 *
	 * This one we turn off as soon as the chat/memebers are loaded
	 */
	var document_watch = function() {
		var _chat = false;
		var _nodes = [];

		// used jsmin to minimize this method ... too many if / if / if
		var _disconnect = function(observer) {
			if (_chat && (observer.disconnect(), _nodes.length)) {
				// do the hash stuff here
				for (var hash = window.location.hash ? window.location.hash.slice(1) : false, li; hash && (li = _nodes.pop());) {
					li = $(li);
					if (li.data("id") === hash) {
						li_handler(li);
					}
				}
				// parse the old fashion way
				li_parse_all();
			}
		};

		var observer = new WebKitMutationObserver(function(mutations) {
			for (var i=0,n=mutations.length; i<n; i++) {
				var mutt = mutations[i];
				if (mutt.type === "childList" && mutt.addedNodes.length > 0) {
					if (mutt.target.nodeName === "OL") {
						if (mutt.target.className.match(/hall-listview-chat/)) {
							// add all the new messages so we can parse them
							for (var j=0,m=mutt.addedNodes.length; j<m; j++) {
								var node = mutt.addedNodes[j];
								if (node.nodeName === "LI") {
									_nodes.push(node);
								}
							}

							// this needs to go last otherwise _nodes.length == 0
							_chat = true;
							_disconnect(observer);
						}
					}
				}
			}
			_disconnect(observer);
		});

		observer.observe(document, {
			subtree: true,
			childList: true,
			attributes: false,
			characterData: false,
			attributeOldValue: false,
			characterDataOldValue: false
			//...
		});
	};

	// only needs to run on start - watches DOM mutations
	document_watch();

	/**
	 * document click events ...
	 */
	$(document)
		.on("click", "time", function(e) {
			li_handler($(e.currentTarget).closest("li.hall-listview-li"));
		})
		.on("click", "a[data-route]", function(/*e*/) {
			// reduced to 3 - quick, med, long
			setTimeout(li_parse_all, 250);
			setTimeout(li_parse_all, 1000);
			setTimeout(li_parse_all, 5000);
		});
});
