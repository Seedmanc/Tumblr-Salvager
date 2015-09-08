// ==UserScript==
// @name           Tumblr Savior for Greasemonkey
// @version        0.5
// @namespace      codeman38
// @description    Saves you from ever having to see another low-quality post ever again. Forked by Seedmanc from codeman38 to add more control over lists and cleanup code.
// @include        https://www.tumblr.com/dashboard*
// @include        https://www.tumblr.com/tagged/*
// ==/UserScript==

var settings = {
	'listWhite': ['people'],
	'listBlack': ['trash'],
	'hide_source': false,
	'show_notice': true,
	'logical_and': true,
	'hide_own_posts': false,
	'show_words': true,
	'match_words': false,
	'hide_promoted': false,
	'white_notice': true,
	'black_notice': true,
	'hide_pinned': false,
	'auto_unpin': false,
	'show_tags': true,
	'hide_premium': false,
	
	'hide_radar':	true,
	'hide_recommended':true,
	'hide_sponsored': true
};

var gotSettings = false;
var manuallyShown = {};
var isTumblrSaviorRunning = false;
var inProgress = {};
var icon = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAnNJREFUeNqMU09M02AU/8awC5vJsu2g4ExwkDgJQzfCEsWEgQxI1CVLvHDadYNE9IAm84KJ3EBPBjGe0ETw6AXmwRBPXhjTkjCTicvC+FPKZC1tt7brs1/JcIMY92val+977/3e7/v6HgIAVAtMJpPR4XA463Q6XeV+/f8SbTbbWY/bfT0QCAQpitI/m5wMV/p1WEElqcFgQFc7Ojq9Xm+Pt6vL53K5blxqbraZrVb0ZXk529Pbaz+loLHx/LmhwaHbnk5Pj/ua+2ZrS4vDpiYoiqKRK6AgmqJQU1OTiSCIelEU5WMGrODR+HhUtcCzLGxns3CYz4PAccCp63dzc/Di+TTs03s4BG719Q1UKqjDH5qmD7Cl9igE6rMUi6GJpxPoTuAu+pVOI5Ik0T5NawmRcHi06pKwgra2K66SLIEsiZBYjcOTaBRez87i3wNrJKlVpnZ3oAy73X6xigDjW2I1hZ07W1vAq/IxfD4fDA8Pw0m8mpl5c4pgdGTk/snAT7EYGI1GyGQy2rpQLGpWkiSwWiyWKgK9Xt/AsuwhDiiVSsckOMTv90OhUABeEIA5CoEHY2MPjy8R56tJwvTU1Eu8KBZFbTOZTKJgMIi6u7sRw7JIEiXE87zm6x8YvKcW1ZcVELipzGZzq8ALJVmW4fdBHtbXkyAIBa2irIqSlb/HI8m1PbW9G8qtLGEV+Xw+tfBh4XMoFOo/QxDI6bx8dEz1XY2vbDMMQ8Xj8ZVEIv41lfr5g+M4oUyAY7Tu+q4CK0xvbDCbm5sbuVxua37+/dulxcWPoiTxp4bl5DS2t7d3RcKRx1ar5UItU6qrdZz/hT8CDADaR5pMovP3DQAAAABJRU5ErkJggg==";
var whiteListed = {};
var blackListed = {};
var hiddenPosts = {};

debugger;

function matchLists(theStr, list){
	rA=[];
	for (i = 0; i < list.length; i++) {
		spl = splitAnd(list[i], settings.logical_and);
		matched = true;
		for (j = 0; j < spl.length; j++) {
			if (settings.match_words) {
				filterRegex = '(^|\\W)(' + spl[j].replace(/\?/g, "\\?").replace(/\)/g, "\\)").replace(/\(/g, "\\(").replace(/\[/g, "\\[").replace(/\x2a/g, "(\\w*?)") + ')(\\W|$)';
				re = new RegExp(filterRegex); 
				matched = theStr.match(re); 
			} else 
				matched = (theStr.indexOf(spl[j]) >= 0);
		}
		if (matched) {
			rA.push(list[i]);
		}
	}
	return rA;
}

function needstobesaved(theStr) {
	var blackList, whiteList, rO, i, filterRegex, re;
	blackList = settings.listBlack;
	whiteList = settings.listWhite;

	rO = {}; 	//returnObject
	rO.bL = []; //returnObject.blackListed
	rO.wL = []; //returnObject.whiteListed
 
	rO.wL = matchLists(theStr, whiteList);
	rO.bL = matchLists(theStr, blackList);		

	return rO;
}

function splitAnd(item, doSplit) {
	if (doSplit)
		return item.split("&").map(Function.prototype.call, String.prototype.toLowerCase);
	else
		return new Array(item.toLowerCase());
}

function addGlobalStyle(styleID, newRules) {
	var cStyle, elmStyle, elmHead, newRule;

	cStyle = document.getElementById(styleID);
	elmHead = document.getElementsByTagName('head')[0];

	if (elmHead === undefined) {
		return false;
	}

	if (cStyle === undefined || cStyle === null) {
		elmStyle = document.createElement('style');
		elmStyle.type = 'text/css';
		elmStyle.id = styleID;
		while (newRules.length > 0) {
			newRule = newRules.pop();
			if (elmStyle.sheet !== undefined && elmStyle.sheet !== null && elmStyle.sheet.cssRules[0] !== null) {
				elmStyle.sheet.insertRule(newRule, 0);
			} else {
				elmStyle.appendChild(document.createTextNode(newRule));
			}
		}
		elmHead.appendChild(elmStyle);
	} else {
		while (cStyle.sheet.cssRules.length > 0) {
			cStyle.sheet.deleteRule(0);
		}
		while (newRules.length > 0) {
			newRule = newRules.pop();
			if (cStyle.sheet !== undefined && cStyle.sheet.cssRules[0] !== null) {
				cStyle.sheet.insertRule(newRule, 0);
			} else {
				cStyle.appendChild(document.createTextNode(newRule));
			}
		}
	}

	return true;
}

function show_tags() {
	var cssRules = [];

	cssRules[0]  = ".tumblr_savior a.tag {";
	cssRules[0] += "font-weight: normal !important;";
	cssRules[0] += "}";
	addGlobalStyle("notice_tags_css", cssRules);
}

function hide_tags() {
	var cssRules = [];

	cssRules[0]  = ".tumblr_savior a.tag {}";
	addGlobalStyle("notice_tags_css", cssRules);
}

function show_white_notice() {
	var cssRules = [];

	cssRules[0]  = ".whitelisted {";
	cssRules[0] += "background: #57b787;";
	if (settings.black_notice) {
		cssRules[0] += "top: 50px;";
	} else {
		cssRules[0] += "top: 20px;";
	}
	cssRules[0] += "}";
	addGlobalStyle("white_notice_style", cssRules);
}

function show_black_notice() {
	var cssRules = [];

	cssRules[0]  = ".blacklisted {";
	cssRules[0] += "background: #d93023;";
	cssRules[0] += "top: 20px;";
	cssRules[0] += "}";
	addGlobalStyle("black_notice_style", cssRules);
}

function hide_white_notice() {
	var cssRules = [];

	cssRules[0]  = ".whitelisted {";
	cssRules[0] += "display: none;";
	cssRules[0] += "}";
	addGlobalStyle("white_notice_style", cssRules);
}

function hide_black_notice() {
	var cssRules = [];

	cssRules[0]  = ".blacklisted {";
	cssRules[0] += "display: none;";
	cssRules[0] += "}";
	addGlobalStyle("black_notice_style", cssRules);
}

function hide_premium() {
	var cssRules = [];

	cssRules[0]  = "#tumblr_radar.premium {";
	cssRules[0] += "display: none;";
	cssRules[0] += "}";
	addGlobalStyle("premium_style", cssRules);
}

function show_premium() {
	var cssRules = [];

	cssRules[0]  = "#tumblr_radar.premium {}";
	addGlobalStyle("premium_style", cssRules);
}

function hide_pinned() {
	var cssRules = [];

	cssRules[0]  = ".promotion_pinned {";
	cssRules[0] += "display: none;";
	cssRules[0] += "}";
	addGlobalStyle("pinned_style", cssRules);
}

function show_pinned() {
	var cssRules = [];

	cssRules[0]  = ".promotion_pinned {}";
	addGlobalStyle("pinned_style", cssRules);
}

function hide_ratings() {
	var cssRules = [];

	cssRules[0]  = ".savior_rating {";
	cssRules[0] += "display: none;";
	cssRules[0] += "}";
	addGlobalStyle("savior_rating_style", cssRules);
}

function show_ratings() {
	var cssRules = [];

	cssRules[0]  = ".savior_rating {";
	cssRules[0] += "position: absolute;";
	cssRules[0] += "left: 532px;";
	cssRules[0] += "width: 20px;";
	cssRules[0] += "height: 20px;";
	cssRules[0] += "-webkit-border-radius: 4px;";
	cssRules[0] += "-webkit-box-shadow: 0 1px 5px rgba(0, 0, 0, .46);";
	cssRules[0] += "border-radius: 4px;";
	cssRules[0] += "}";
	cssRules[1]  = ".savior_rating:hover {";
	cssRules[1] += "overflow: hidden;";
	cssRules[1] += "white-space: nowrap;";
	cssRules[1] += "width: 200px;";
	cssRules[1] += "}";
	cssRules[2]  = ".savior_rating:hover span{";
	cssRules[2] += "display: inline;";
	cssRules[2] += "}";
	cssRules[3]  = ".savior_rating img {";
	cssRules[3] += "margin: 2px 0px 0px 2px;";
	cssRules[3] += "}";
	cssRules[4]  = ".savior_rating span{";
	cssRules[4] += "display: none;";
	cssRules[4] += "line-height:20px;";
	cssRules[4] += "margin-left:2px;";
	cssRules[4] += "vertical-align: top;";
	cssRules[4] += "}";
	addGlobalStyle("savior_rating_style", cssRules);
}

function hide_source() {
	var cssRules = [];

	cssRules[0]  = 'div.post_source {display:none!important;}';
	addGlobalStyle("source_url_style", cssRules);
}

function show_source() {
	var cssRules = [];

	cssRules[0]  = 'div.post_source {}';
	addGlobalStyle("source_url_style", cssRules);
}

function unpin(thepost) {
	var clickUnpin, pins, pin;

	clickUnpin = document.createEvent("MouseEvents");
	clickUnpin.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	pins = thepost.getElementsByClassName("pin");
	pin = pins[0];
	if (pin !== undefined) {
		pin.dispatchEvent(clickUnpin);
	}
}

function applySettings() {
	if (settings.hide_source) {
		hide_source();
	} else {
		show_source();
	}

	if (settings.white_notice || settings.black_notice) {
		show_ratings();
	} else {
		hide_ratings();
	}

	if (settings.black_notice) {
		show_black_notice();
	} else {
		hide_black_notice();
	}

	if (settings.white_notice) {
		show_white_notice();
	} else {
		hide_white_notice();
	}

	if (settings.hide_pinned) {
		hide_pinned();
	} else {
		show_pinned();
	}

	if (settings.show_tags) {
		show_tags();
	} else {
		hide_tags();
	}

	if (settings.hide_premium) {
		hide_premium();
	} else {
		show_premium();
	}
	
	if (settings.hide_radar) {
		hide_radar();
	}
	
	if (settings.hide_recommended) {
		hide_recommended();
	}
	
	if (settings.hide_sponsored) {
		hide_sponsored();
	}
}

function parseSettings(savedSettings) {
	var parsedSettings = {};

	if (savedSettings === undefined || savedSettings === null || savedSettings === '' || savedSettings === '{}') {
		parsedSettings = defaultSettings;
	} else {
		try {
			parsedSettings = JSON.parse(savedSettings);
		} catch (err) {
			parsedSettings = defaultSettings;
		}
	}

	return parsedSettings;
}

function getAuthor(post) {
	var author = {
		name: post.dataset.tumblelogName
	};

	var avatar = document.getElementById(post.id.replace('_', '_avatar_'));

	if (avatar) {
		author.avatar = avatar.getAttribute("style").replace('background-image:url(\'', '').replace('_64.', '_40.').replace('\')', '');
	}

	return author;
}

function handleReveal(e) {
	var searchUp;

	e.preventDefault();
	e.stopPropagation();

	searchUp = e.target;

	while (searchUp.tagName !== "LI") {
		searchUp = searchUp.parentNode;
	}

	postId = searchUp.id.replace('notification_','');
	theList = searchUp.parentNode;
	theList.insertBefore(hiddenPosts[postId], searchUp);
	theList.removeChild(searchUp);
	manuallyShown[postId] = true;
}


function checkPost(post) {
	var olPosts, liPost, bln, wln, liRemove, n, savedfrom, author, li_notice, a_avatar, img_avatar, nipple_border, nipple, a_author, txtPosted, txtContents, j, br, a_reveal, i_reveal, span_notice_tags, span_tags, divRating, imgRating, spanWhitelisted, spanBlacklisted, anchors, a, remove, ribbon_right, ribbon_left;

	if (post.className.indexOf('not_mine') < 0 && !settings.hide_own_posts) {
		return;
	}

	if (manuallyShown[post.id]) {
		return;
	}

	if (settings.auto_unpin && post.className.indexOf('promotion_pinned') >= 0) {
		unpin(post);
	}

	olPosts = document.getElementById('posts');

	if (post.tagName === 'DIV') {
		liPost = post.parentNode;
	} else {
		liPost = post;
	}

	bln = post.getElementsByClassName("blacklisted");
	wln = post.getElementsByClassName("whitelisted");
	liRemove = document.getElementById('notification_' + post.id);

	if (liRemove) {
		liRemove.parentNode.removeChild(liRemove);
	}

	if (bln.length) {
		for (n = 0; n < bln.length; n++) {
			if (bln[n].parentNode) {
				bln[n].parentNode.removeChild(bln[n]);
			}
		}
	}

	if (wln.length) {
		for (n = 0; n < wln.length; n++) {
			if (wln[n].parentNode) {
				wln[n].parentNode.removeChild(wln[n]);
			}
		}
	}

	savedfrom = needstobesaved(post.textContent.toLowerCase());

	if (savedfrom.bL.length && savedfrom.wL.length === 0) {
		if (settings.show_notice) {
			author = getAuthor(post);

			li_notice = document.createElement('li');
			li_notice.id = 'notification_' + post.id;
			li_notice.className = 'notification single_notification tumblr_savior';

			div_inner = document.createElement('DIV');
			div_inner.className = "notification_inner clearfix";

			div_sentence = document.createElement('DIV');
			div_sentence.className = "notification_sentence";

			div_inner.appendChild(div_sentence);
			li_notice.appendChild(div_inner);

			a_avatar = document.createElement('a');
			a_avatar.href = "http://" + author.name + ".tumblr.com/";
			a_avatar.className = "avatar_frame";
			a_avatar.title = author.name;

			img_avatar = document.createElement('img');
			img_avatar.src = author.avatar;
			img_avatar.className = "avatar";
			img_avatar.title = author.name;

			a_author = document.createElement('a');
			a_author.href = "http://" + author.name + ".tumblr.com/";
			a_author.className = "username";
			a_author.textContent = author.name;

			a_avatar.appendChild(img_avatar);

			li_notice.appendChild(a_avatar);
			div_sentence.appendChild(a_author);

			txtPosted = document.createTextNode(" made a post containing");
			div_sentence.appendChild(txtPosted);

			if (settings.show_words) {

				txtContents = ":";

				for (j = 0; j < savedfrom.bL.length; j++) {
					if (savedfrom.bL.length > 2 && j !== 0 && j < savedfrom.bL.length - 1) {
						txtContents += ',';
					}
					if (savedfrom.bL.length > 1 && j === savedfrom.bL.length - 1) {
						txtContents += ' and';
					}
					txtContents += ' \'' + savedfrom.bL[j] + '\'';
				}

				div_sentence.appendChild(document.createTextNode(txtContents));
			} else {
				div_sentence.appendChild(document.createTextNode(' something from your blacklist.'));
			}

			a_reveal = document.createElement("a");
			a_reveal.href = "#";

			i_reveal = document.createElement("i");
			i_reveal.appendChild(document.createTextNode(" -- click to show."));

			li_notice.addEventListener("click", handleReveal, false);

			a_reveal.appendChild(i_reveal);
			// List items still aren't keyboard-focusable. This should help with that.
			a_reveal.addEventListener("click", handleReveal, false);

			div_sentence.appendChild(a_reveal);

			if (settings.show_tags) {

				span_tags = post.getElementsByClassName('post_tags');

				if (span_tags.length) {
					div_sentence.appendChild(document.createElement("br"));
					div_sentence.appendChild(document.createElement("br"));

					span_notice_tags = document.createElement("span");
					span_notice_tags.appendChild(document.createTextNode("Tags: "));
					span_notice_tags.appendChild(document.createTextNode(span_tags[0].textContent));

					div_sentence.appendChild(span_notice_tags);
				}
			}

			if (liPost.nextSibling) {
				olPosts.insertBefore(li_notice, liPost.nextSibling);
			} else {
				olPosts.appendChild(li_notice);
			}
		}
		hiddenPosts[post.id] = liPost;
		olPosts.removeChild(liPost);
	} else if (liPost.style.display === 'none' && liPost.className.indexOf('tumblr_hate') < 0) {
		liPost.style.display = 'list-item';
		if (settings.show_notice) {
			liRemove = document.getElementById('notification_' + post.id);
			if (liRemove) {
				olPosts.removeChild(liRemove);
			}
		}
	}

	divRating = document.getElementById('white_rating_' + post.id);

	if (divRating) {
		divRating.parentNode.removeChild(divRating);
	}

	if (savedfrom.wL.length > 0 && settings.white_notice) {
		whiteListed[post.id] = [];

		while (savedfrom.wL.length > 0) {
			whiteListed[post.id].push(savedfrom.wL.pop());
		}

		divRating = document.createElement('div');
		divRating.id = 'white_rating_' + post.id;
		divRating.className = 'savior_rating whitelisted';

		imgRating = document.createElement('img');
		imgRating.src = 'data:image/png;base64,' + icon;
		imgRating.title = whiteListed[post.id].join(", ");

		divRating.appendChild(imgRating);

		spanWhitelisted = document.createElement('span');
		spanWhitelisted.textContent = whiteListed[post.id].join(", ");

		divRating.appendChild(spanWhitelisted);
		post.appendChild(divRating);
	}

	divRating = document.getElementById('black_rating_' + post.id);

	if (divRating) {
		divRating.parentNode.removeChild(divRating);
	}

	if (savedfrom.bL.length > 0 && settings.black_notice) {
		blackListed[post.id] = [];

		while (savedfrom.bL.length > 0) {
			blackListed[post.id].push(savedfrom.bL.pop());
		}

		divRating = document.createElement('div');
		divRating.id = 'black_rating_' + post.id;
		divRating.className = 'savior_rating blacklisted';

		imgRating = document.createElement('img');
		imgRating.src = 'data:image/png;base64,' + icon;
		imgRating.title = blackListed[post.id].join(", ");

		divRating.appendChild(imgRating);

		spanBlacklisted = document.createElement('span');
		spanBlacklisted.textContent = blackListed[post.id].join(", ");

		divRating.appendChild(spanBlacklisted);
		post.appendChild(divRating);
	}

	anchors = post.getElementsByTagName('a');
	
	if (settings.hide_promoted) {
		for (a = 0; a < anchors.length; a++) {
			if (anchors[a].outerHTML && anchors[a].outerHTML.indexOf('blingy blue') >= 0) {
				anchors[a].outerHTML = anchors[a].outerHTML.replace(/blingy blue/gm, " ");
			}
		}
	}

	if (settings.hide_promoted) {
		if (post.outerHTML.indexOf("promotion_highlighted") >= 0) {
			remove = post.id;
			document.getElementById(remove).className = document.getElementById(remove).className.replace(/promotion_highlighted/gm, "");
			ribbon_right = document.getElementById("highlight_ribbon_right_" + remove.replace("post_", ""));
			ribbon_left = document.getElementById("highlight_ribbon_left_" + remove.replace("post_", ""));
			ribbon_right.parentNode.removeChild(ribbon_right);
			ribbon_left.parentNode.removeChild(ribbon_left);
		}
	}
}

function hide_radar(){
	var remove=document.getElementById('tumblr_radar');
	remove.parentNode.removeChild(remove);
	remove=document.getElementsByClassName('controls_section controls_section_radar')[0];
	remove.parentNode.removeChild(remove);
}

function hide_recommended(){
	var toHide=document.getElementsByClassName('is_recommended');
	for (i=toHide.length; i--;) {
		toHide[i].setAttribute('style', 'display:none'); 
	};
}

function hide_sponsored(){
	var toHide=document.getElementsByClassName('yamplus-unit-container');
	for (i=toHide.length; i--;) {
		toHide[i].setAttribute('style', 'display:none'); 
	};
}

function handlePostInserted(argPost) {
	var post = argPost.target;

	if (!post.id || post.id.indexOf('post_') !== 0) {
		return;
	}

	if (inProgress[post.id]) {
		return;
	}

	if (!gotSettings) {
		return inProgress[post.id] = true;
	}

	checkPost(post);
}

function wireupnodes() {
	document.addEventListener('animationstart', handlePostInserted, false);
	document.addEventListener('MSAnimationStart', handlePostInserted, false);
	document.addEventListener('webkitAnimationStart', handlePostInserted, false);
	document.addEventListener('OAnimationStart', handlePostInserted, false);

	var cssRules = [];

	cssRules[0]  = "@keyframes nodeInserted {";
	cssRules[0] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[0] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[0] += "}";

	cssRules[1]  = "@-moz-keyframes nodeInserted {";
	cssRules[1] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[1] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[1] += "}";

	cssRules[2]  = "@-webkit-keyframes nodeInserted {";
	cssRules[2] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[2] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[2] += "}";

	cssRules[3]  = "@-ms-keyframes nodeInserted {";
	cssRules[3] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[3] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[3] += "}";

	cssRules[4]  = "@-o-keyframes nodeInserted {";
	cssRules[4] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[4] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[4] += "}";

	cssRules[5]  = "li.post_container div.post, li.post {";
	cssRules[5] += "    animation-duration: 1ms;";
	cssRules[5] += "    -o-animation-duration: 1ms;";
	cssRules[5] += "    -ms-animation-duration: 1ms;";
	cssRules[5] += "    -moz-animation-duration: 1ms;";
	cssRules[5] += "    -webkit-animation-duration: 1ms;";
	cssRules[5] += "    animation-name: nodeInserted;";
	cssRules[5] += "    -o-animation-name: nodeInserted;";
	cssRules[5] += "    -ms-animation-name: nodeInserted;";
	cssRules[5] += "    -moz-animation-name: nodeInserted;";
	cssRules[5] += "    -webkit-animation-name: nodeInserted;";
	cssRules[5] += "}";

	addGlobalStyle("wires", cssRules);
}

function checkPosts() {
	for (var postId in inProgress) {
		checkPost(document.getElementById(postId));
		delete inProgress[postId];
	}
}

function diaper() {
	var posts = document.getElementsByClassName('post');
	for (var i = 0; i < posts.length; i += 1) {
		var post = posts[i];
		if (post.id && post.id.indexOf("post") === 0) {
			inProgress[post.id] = true;
		}
	}
	checkPosts();
}

function waitForPosts() {
	var olPosts;

	gotSettings = true;
	olPosts = document.getElementById('posts');
	if (olPosts === null && !isTumblrSaviorRunning) {
		setTimeout(waitForPosts, 10);
	} else if (!isTumblrSaviorRunning) {
		wireupnodes();
		isTumblrSaviorRunning = true;
		setTimeout(diaper, 200);
	} else {
		diaper();
	}
}

function checkurl(url, filter) {
	var filterRegex, re, f;

	for (f = 0; f < filter.length; f++) {
		filterRegex = filter[f].replace(/\x2a/g, "(.*?)");
		re = new RegExp(filterRegex);
		if (url.match(re)) {
			return true;
		}
	}
	return false;
}

applySettings();

waitForPosts();