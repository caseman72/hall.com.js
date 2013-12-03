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
		re_hex: /(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}|rgba?\(.*?\))/g,
		re_bug: /(^|[^\B\/"'>])(vis|ar|hd)[-]([0-9]+)([^\B'"<]|$)/gi,
		re_me: /(^|[^\B\/"'>])\/me([^\B'"<]|$)/g,
		re_hr: /\n?[-]{10,}([<\n])/g,
		re_ds: /(?:[ ]{2,}|\n|\r|\t)+/g,
		// hashes
		ols: {},
		bots: {},
		rooms: {},
		current_display_name: "",
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

	$(document).on("click", "time", function(e) {
		li_handler($(e.currentTarget).closest("li.hall-listview-li"));
	});


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

		var $options = $.hall_object;
		var current_user = $options.current_display_name = $(".user-settings:first").find(".current-user").find(".fullname").text();

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
		rooms.each(function(i_not_used, elem) {
			var room_id = ($(elem).data("route") || "").replace(/^rooms\/([^\/]+)\/?.*$/, "$1");
			if (room_id) {
				$(elem).data("room-id", room_id);
				if (!(room_id in $options.rooms)) {
					$options.rooms[room_id] = $options.states.init;
				}
			}
		});

		// second loop to 'get' rooms if not-processed
		rooms.each(function(i_not_used, elem) {
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
			$(".hall-listview-chat").find("li").each(function(i_not_used, li) {
				li_parse(li);
			});
		}
		else {
			parse_room_links();
		}
	};


	/**
	 * when new li's show up this parses the users in the msg div
	 *
	 */
	var li_parse = function(li) {
		var $li = $(li);

		// already parsed
		if ($li.hasClass("lip")) {
			return false;
		}
		// this happens at the start - sucks to keep checking
		if (!rooms_done()) {
			parse_room_links();
			return false;
		}

		// meat of the code
		var $options = $.hall_object;
		var msg = $li.find(".msg");
		var time = $li.find("time");
		var cite = $li.find("cite");
		var cite_text = $.trim(cite.text() || "");
		var curr_user = cite_text === $options.current_display_name; // TODO: use the user_id

		// fix class names single space trimmed and add lip - this will force a redraw - boo
		li.className = $.trim((""+li.className).replace($options.re_ds, " ")) + " lip";

		// <Leader>status
		if (curr_user && time.hasClass("localtime")) {
			var status_parts = $options.re_status.exec(msg.html());
			if (status_parts) {
				update_status(status_parts[1], status_parts[2]);
			}
		}
		else if (msg.length) {
			var msg_html = msg.html();

			if (cite.length && !cite.hasClass("gbp")) {
				cite.addClass("gbp");

				// <Leader>status
				if ($options.re_status.test(msg_html)) {
					msg_html = msg_html.replace($options.re_status, function(str_not_used, p1, p2) {
						p1 = $.trim(p1), p2 = $.trim(p2);
						return '<span class="'+(curr_user?"curr":"user")+'">'+cite_text+'</span> is '+p1+(p2?' says "'+p2+'"':'');
					});
					msg.html(msg_html);
					$li.addClass("me");
				}
				// robot messages
				else {
					for (var name in $options.bots) {
						if (name === cite_text) {
							$li.addClass("git_bot");
							break;
						}
					}
				}
			}

			if (!$li.hasClass("me") && !$li.hasClass("git_bot")) {
				// source code
				var source_parts = $options.re_source.exec(msg_html.replace(/\$/g, "{__%24__}"));
				if (source_parts) {
					var source_lang = (source_parts[1] == "code" ? "js" : source_parts[1]);
					var line_count = (msg_html.match(/\n/g)||[]).length;

					msg_html = msg_html
						.replace($options.re_source, '<pre class="'+ source_lang +'">'+ source_parts[2] +"</pre>")
						.replace(/\{__%24__\}/g, "$");
					msg.html(msg_html)
						.find("pre."+source_lang)
						.snippet(source_lang, {style:"typical", showNum: (line_count > 7)});

					// add some space
					if (line_count > 0) {
						// hack to get the boxes to align on the right
						msg.css("padding-right", ($li.hasClass("nested") ? "50px" : "13px"));
					}

					$li.addClass("source_code");
				}
				else {
					var re_current = $options.re_current;
					var re_user = $options.re_user;
					var re_table = $options.re_table;
					var re_hex = $options.re_hex;
					var re_me = $options.re_me;

					// current
					if (re_current.test(msg_html)) {
						msg_html = msg_html.replace(re_current, "<span class='curr'>$1</span>");
						msg.html(msg_html);
					}
					// users
					if (re_user.test(msg_html)) {
						msg_html = msg_html.replace(re_user, "<span class='user'>$1</span>");
						msg.html(msg_html);
					}
					// <Leader>me
					if (re_me.test(msg_html)) {
						msg_html = msg_html.replace(re_me, '$1<span class="'+(curr_user?"curr":"user")+'">'+cite_text+'</span>$2');
						msg.html(msg_html);
						$li.addClass("me");
					}

					// ascii tables
					if (re_table.test(msg_html)) {
						msg.find("code").addClass("fixed-font");
					}
					// hex not in code
					else if (re_hex.test(msg_html)) {
						msg_html = msg_html.replace(re_hex, '$1 <span class="hex-preview" style="background-color: $1;">&nbsp;</span>');
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
				msg_html = msg_html.replace(re_bug, function(str_not_used, p1, p2, p3, p4) {
					p2 = p2.toUpperCase();
					return p1+'<a href="http://bugtracker/browse/'+p2+'-'+p3+'" target="_blank">'+p2+'-'+p3+'</a>'+p4;
				});
				msg.html(msg_html);
			}
		}

		return true;
	};


	// https://github.com/naugtur/insertionQuery
	var anime_watch = function(selector, callback) {
		var guid = selector.replace(/[^a-zA-Z0-9]+/g, "_") +"_"+ ((new Date()).getTime());

		$("<style/>").html([
			"@-webkit-keyframes {guid} { from { clip: rect(auto, auto, auto, auto); } to { clip: rect(auto, auto, auto, auto); } }",
			"@keyframes {guid} { from { clip: rect(auto, auto, auto, auto); } to { clip: rect(auto, auto, auto, auto); } }",
			"{selector} { animation-duration: 0.001s; animation-name: {guid}; -webkit-animation-duration: 0.001s; -webkit-animation-name: {guid}; }"
		].join("\n").replace(/\{guid\}/g, guid).replace(/\{selector\}/g, selector)).appendTo("head");


		var eventHandler = function(event) {
			if (event.animationName === guid || event.WebkitAnimationName === guid) {
				callback.call(event.target, event.target);
			}
		}

		// do it now - document ready should be ok - or [setTimeout, 0]
		document.addEventListener("animationstart", eventHandler, false);
		document.addEventListener("webkitAnimationStart", eventHandler, false);
	};

	// watches the animation event and parses li if they are inserted
	anime_watch("li.hall-listview-li", function(li) {
		li_parse(li);
	});


	// start the show
	setTimeout(parse_room_links, 250);


	// idle timeout to something more than 90s
	setTimeout(function() {
		var script = document.createElement("script");
		script.innerHTML = [
			'if (window.CL && CL.IdleTimer && CL.IdleTimer.prototype) {',
			'  CL.IdleTimer.prototype.timeBeforeIdle = 3E7;', // 8.3333 hours
			'}'
		].join("\n");
		document.getElementsByTagName("body")[0].appendChild(script);
	}, 1000);
});
