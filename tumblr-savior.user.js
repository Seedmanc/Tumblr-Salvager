// ==UserScript==
// @name           Tumblr Salvager for GM
// @version        0.5
// @namespace      http://github.com/Seedmanc/Tumblr-Salvager
// @description    Salvage the few high quality posts from the rubble of your dashboard
// @include        https://www.tumblr.com/dashboard*
// @include        https://www.tumblr.com/tagged/*
// ==/UserScript==

var settings = {
	'listUltraWhite':'quality',
	'listInfraBlack':'equality',
	'listWhite':	'people',
	'listBlack':	'trash',
	
	'hide_source':	false,
	'show_notice':	true,
	'logical_and':	true,
	'hide_own_posts':false,
	'show_words':	true,
	'match_words':	false,
	'hide_promoted':true,
	'white_notice':	true,
	'black_notice':	true,
	'hide_pinned':	true,
	'auto_unpin':	true,
	'show_tags':	true,
	'hide_premium':	true,
	
	'hide_radar':	true,
	'hide_recommended':false,
	'hide_sponsored':false
};

var gotSettings = false;
var manuallyShown = {};
var isTumblrSaviorRunning = false;
var inProgress = {};
var icon = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAnNJREFUeNqMU09M02AU/8awC5vJsu2g4ExwkDgJQzfCEsWEgQxI1CVLvHDadYNE9IAm84KJ3EBPBjGe0ETw6AXmwRBPXhjTkjCTicvC+FPKZC1tt7brs1/JcIMY92val+977/3e7/v6HgIAVAtMJpPR4XA463Q6XeV+/f8SbTbbWY/bfT0QCAQpitI/m5wMV/p1WEElqcFgQFc7Ojq9Xm+Pt6vL53K5blxqbraZrVb0ZXk529Pbaz+loLHx/LmhwaHbnk5Pj/ua+2ZrS4vDpiYoiqKRK6AgmqJQU1OTiSCIelEU5WMGrODR+HhUtcCzLGxns3CYz4PAccCp63dzc/Di+TTs03s4BG719Q1UKqjDH5qmD7Cl9igE6rMUi6GJpxPoTuAu+pVOI5Ik0T5NawmRcHi06pKwgra2K66SLIEsiZBYjcOTaBRez87i3wNrJKlVpnZ3oAy73X6xigDjW2I1hZ07W1vAq/IxfD4fDA8Pw0m8mpl5c4pgdGTk/snAT7EYGI1GyGQy2rpQLGpWkiSwWiyWKgK9Xt/AsuwhDiiVSsckOMTv90OhUABeEIA5CoEHY2MPjy8R56tJwvTU1Eu8KBZFbTOZTKJgMIi6u7sRw7JIEiXE87zm6x8YvKcW1ZcVELipzGZzq8ALJVmW4fdBHtbXkyAIBa2irIqSlb/HI8m1PbW9G8qtLGEV+Xw+tfBh4XMoFOo/QxDI6bx8dEz1XY2vbDMMQ8Xj8ZVEIv41lfr5g+M4oUyAY7Tu+q4CK0xvbDCbm5sbuVxua37+/dulxcWPoiTxp4bl5DS2t7d3RcKRx1ar5UItU6qrdZz/hT8CDADaR5pMovP3DQAAAABJRU5ErkJggg==";
var hiddenPosts = {};

debugger;

function matchLists(theStr, list){
	
	list=list.split(',').map(function(v){
		return v.trim().toLowerCase();
	});
	
	var rA=[], filterRegex;
	for (i = 0; i < list.length; i++) {
		var spl = splitAnd(list[i], settings.logical_and);
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
	var rO;

	rO = {}; 	//returnObject
	rO.uwhite= [];
	rO.iblack= [];
	rO.black = []; //returnObject.blackListed
	rO.white = []; //returnObject.whiteListed
 	
	rO.uwhite= matchLists(theStr, settings.listUltraWhite);
	rO.iblack= matchLists(theStr, settings.listInfraBlack);	
	rO.white = matchLists(theStr, settings.listWhite);
	rO.black = matchLists(theStr, settings.listBlack);	
	
	return rO;
}

function splitAnd(item, doSplit) {
	if (doSplit)
		return item.split("&").map(Function.prototype.call, String.prototype.trim);
	else
		return new Array(item);
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

function show_white_notices() {
	var cssRules = [];

	cssRules[0]  = ".whitelisted {";
	cssRules[0] += "background: #6c7;";
	cssRules[0] += "top: 20px;";
	cssRules[0] += "}";
	
	cssRules[1]  = ".uwhitelisted {";
	cssRules[1] += "background: #6cd;";
	cssRules[1] += "top: 0px;";
	cssRules[1] += "}";

	addGlobalStyle("white_notice_style", cssRules);
}

function show_black_notices() {
	var cssRules = [];

	cssRules[0]  = ".blacklisted {";
	cssRules[0] += "background: #d33;";
	cssRules[0] += "top: 40px;";
	cssRules[0] += "color: #bbb;";
	cssRules[0] += "}";

	cssRules[1]  = ".iblacklisted {";
	cssRules[1] += "background: #732;";
	cssRules[1] += "top: 60px;";
	cssRules[1] += "color: #bbb;";
	cssRules[1] += "}";	
	
	addGlobalStyle("black_notice_style", cssRules);
}

function hide_white_notices() {
	var cssRules = [];

	cssRules[0]  = ".whitelisted, .uwhitelisted {";
	cssRules[0] += "display: none;";
	cssRules[0] += "}";
	addGlobalStyle("white_notice_style", cssRules);
}

function hide_black_notices() {
	var cssRules = [];

	cssRules[0]  = ".blacklisted, .iblacklisted {";
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

function hide_pinned() {
	var cssRules = [];

	cssRules[0]  = ".promotion_pinned {";
	cssRules[0] += "display: none;";
	cssRules[0] += "}";
	addGlobalStyle("pinned_style", cssRules);
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
	settings=parseSettings();
	
	if (settings.hide_source) 
		hide_source();

	if (settings.white_notice || settings.black_notice) 
		show_ratings();

	if (settings.black_notice) 
		show_black_notices()
	else
		hide_black_notices();

	if (settings.white_notice) 
		show_white_notices()
	else
		hide_white_notices();

	if (settings.hide_pinned) 
		hide_pinned();

	if (settings.show_tags) 
		show_tags(); 

	if (settings.hide_premium) 
		hide_premium();
	
	if (settings.hide_radar) 
	//	hide_radar();
	
	if (settings.hide_recommended) 
		hide_recommended();

	if (settings.hide_sponsored) 
		hide_sponsored();
}

function parseSettings(savedSettings) {
	var parsedSettings = settings;

	if (settings === undefined || settings === null || settings === '' || settings === {}) 
		parsedSettings = defaultSettings;
		
	parsedSettings.listWhite=(typeof parsedSettings.listWhite == 'string')?parsedSettings.listWhite:String(parsedSettings.listWhite||'');
	parsedSettings.listBlack=(typeof parsedSettings.listBlack == 'string')?parsedSettings.listBlack:String(parsedSettings.listBlack||'');
	parsedSettings.listUltraWhite=(typeof parsedSettings.listUltraWhite == 'string')?parsedSettings.listUltraWhite:String(parsedSettings.listUltraWhite||'');
	parsedSettings.listInfraBlack=(typeof parsedSettings.listInfraBlack == 'string')?parsedSettings.listInfraBlack:String(parsedSettings.listInfraBlack||'');
	
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


function displayRating(color, post, savedfrom) {

	var listed={};
	listed[post.id] = [];

	while (savedfrom[color].length > 0) {
		listed[post.id].push(savedfrom[color].pop());
	}

	divRating = document.createElement('div');
	divRating.id = color+'_rating_' + post.id;
	divRating.className = 'savior_rating '+color+'listed';

	imgRating = document.createElement('img');
	imgRating.src = 'data:image/png;base64,' + icon;
	imgRating.title = listed[post.id].join(", ");

	divRating.appendChild(imgRating);

	spanListed = document.createElement('span');
	spanListed.textContent = listed[post.id].join(", ");

	divRating.appendChild(spanListed);
	post.appendChild(divRating);
}

function checkPost(post) {
	var olPosts, liPost, liRemove, savedfrom, author, li_notice, a_avatar, img_avatar, a_author, txtPosted, txtContents, j, a_reveal;
	var divRating, imgRating, spanWhitelisted, spanBlacklisted, anchors, a, remove, ribbon_right, ribbon_left, i_reveal, span_notice_tags, span_tags;
debugger;
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

	liRemove = document.getElementById('notification_' + post.id);

	if (liRemove) {
		liRemove.parentNode.removeChild(liRemove);
	}

	savedfrom = needstobesaved(post.textContent.toLowerCase());

	if (savedfrom.uwhite.length===0) 
	  if ((savedfrom.black.length && savedfrom.white.length === 0) || savedfrom.iblack.length)	{
	  
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
				var bls = savedfrom.iblack.concat(savedfrom.black);
				txtContents = ":";

				for (j = 0; j < bls.length; j++) {
					if (bls.length > 2 && j !== 0 && j < bls.length - 1) {
						txtContents += ',';
					}
					if (bls.length > 1 && j === bls.length - 1) {
						txtContents += ' and';
					}
					txtContents += ' \'' + bls[j] + '\'';
				}

				div_sentence.appendChild(document.createTextNode(txtContents));
			} else {
				div_sentence.appendChild(document.createTextNode(' something from your blacklists.'));
			}

			a_reveal = document.createElement("a");
			a_reveal.href = "#";

			i_reveal = document.createElement("i");
			i_reveal.appendChild(document.createTextNode(" — click to show."));

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
					span_notice_tags.appendChild(document.createTextNode(span_tags[0].textContent.replace(/#/g,' #')));

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
	}
	
	divRating = document.getElementById('white_rating_' + post.id);

	if (divRating) {
		divRating.parentNode.removeChild(divRating);
	}
	
	if (settings.white_notice) {
		if (savedfrom.white.length > 0) 
			displayRating('white', post, savedfrom);

		if (savedfrom.uwhite.length > 0) 
			displayRating('uwhite', post, savedfrom);
	}

	divRating = document.getElementById('black_rating_' + post.id);

	if (divRating) {
		divRating.parentNode.removeChild(divRating);
	}
	
	if (settings.black_notice) {
		if (savedfrom.black.length > 0) 
			displayRating('black', post, savedfrom);

		if (savedfrom.iblack.length > 0) 
			displayRating('iblack', post, savedfrom);
	}
	
	anchors = post.getElementsByTagName('a');
	
	if (settings.hide_promoted) {
		for (a = 0; a < anchors.length; a++) {
			if (anchors[a].outerHTML && anchors[a].outerHTML.indexOf('blingy blue') >= 0) {
				anchors[a].outerHTML = anchors[a].outerHTML.replace(/blingy blue/gm, " ");
			}
		}
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
	var toHide=document.querySelectorAll('.is_recommended, .recommended-unit-container');
	for (i=toHide.length; i--;) {
		toHide[i].setAttribute('style', 'display:none'); 
	}
}

function hide_sponsored(){
	var toHide=document.getElementsByClassName('yamplus-unit-container');
	for (i=toHide.length; i--;) {
		toHide[i].setAttribute('style', 'display:none'); 
	}
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
	if (settings.hide_radar)
		hide_radar();
	checkPosts();
}

function waitForPosts() {
	var olPosts;

	gotSettings = true;
	olPosts = document.getElementById('posts');
	if (olPosts === null && !isTumblrSaviorRunning) {
		setTimeout(waitForPosts, 10);
	} else if (!isTumblrSaviorRunning) {
		isTumblrSaviorRunning = true;
		setTimeout(diaper, 200);
	} else {
		diaper();
	}
}

var defaultSettings = {
	'listUltraWhite':'',
	'listInfraBlack':'',
	'listWhite': '',
	'listBlack': '',
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
	
	'hide_radar':	false,
	'hide_recommended':false,
	'hide_sponsored': false
};

applySettings();

waitForPosts();