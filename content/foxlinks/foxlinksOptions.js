var checkboxes = ["quickPost", "pageJump", "specialLinks", "postButtons", "messageNumbering", "advancedSearch", "dancinJesus", "switchButtonPositions", "disableMainStyle", "inlineImageExpansion", "sortByTopicsLastPost", "batchUploader", "jumpToQuote", "highlightQuotes", "awesomeQuotes", "livierlinks", "notificationsHighlighted", "notificationsQuoted"];
var strings    = ["stylesheetLink"/*, "sig"*/];
var integers   = ["searchBox"];
var sandbox    = null;

if (!JSON)
	sandbox = new Components.utils.Sandbox("about:blank");

function foxlinksInitOps()
{
	foxlinksFixStrings();

	checkboxes.forEach(function (element, index, array) {
		document.getElementById("foxlinks" + element.charAt(0).toUpperCase() + element.substring(1)).checked = nsPreferences.getBoolPref("foxlinks." + element);
	});

	strings.forEach(function (element, index, array) {
		document.getElementById("foxlinks" + element.charAt(0).toUpperCase() + element.substring(1)).value = nsPreferences.copyUnicharPref("foxlinks." + element);
	});

	integers.forEach(function (element, index, array) {
		document.getElementById("foxlinks" + element.charAt(0).toUpperCase() + element.substring(1)).selectedItem = document.getElementById("foxlinks" + element.charAt(0).toUpperCase() + element.substring(1)).getElementsByAttribute('value', nsPreferences.getIntPref("foxlinks." + element))[0];
	});

	document.getElementById("foxlinksQuoteMsg").checked = nsPreferences.getIntPref("foxlinks.dblclickQuote") & FOXLINKS_QUOTE_MESSAGE;
	document.getElementById("foxlinksQuoteMsgTop").checked = nsPreferences.getIntPref("foxlinks.dblclickQuote") & FOXLINKS_QUOTE_MESSAGETOP;

	if (nsPreferences.copyUnicharPref("foxlinks.newHighlight") != null && nsPreferences.copyUnicharPref("foxlinks.newHighlight") != "")
			foxlinksFillTree();
	else {
		var treeList = {};

		try {
			var highlightNames = nsPreferences.copyUnicharPref("foxlinks.highlight").split(/,[\s]*/g);
			var highlightColor = nsPreferences.copyUnicharPref("foxlinks.highlightColor");
			var highlightPosts = nsPreferences.getBoolPref("foxlinks.highlightMsgs");
			var highlightTopics = nsPreferences.getBoolPref("foxlinks.highlightTopics");

			highlightNames.forEach(function (element, index, array) {
				treeList[element] = { color: highlightColor, text: "#000000", hide: false, posts: highlightPosts, topics: highlightTopics, links: highlightTopics};
			});
		} catch(e) {}

		try {
			var blacklistNames = nsPreferences.copyUnicharPref("foxlinks.blacklist").split(/,[\s]*/g);
			var blacklistColor = nsPreferences.copyUnicharPref("foxlinks.blacklistColor");
			var blacklistPosts = nsPreferences.getBoolPref("foxlinks.blacklistMsgs");
			var blacklistTopics = nsPreferences.getBoolPref("foxlinks.blacklistTopics");

			blacklistNames.forEach(function (element, index, array) {
				treeList[element] = { color: blacklistColor, text: "#000000", hide: true, posts: blacklistPosts, topics: blacklistTopics, links: blacklistTopics};
			});
		} catch(e) {}

		try {
			if (JSON)
				nsPreferences.setUnicharPref("foxlinks.newHighlight", JSON.stringify(treeList));
			else
				nsPreferences.setUnicharPref("foxlinks.newHighlight", treeList.toSource().match(/^\(?(.*?)\)?$/)[1]);
		} catch (e) {}

		foxlinksFillTree();
	}
}

function foxlinksSaveOps()
{
	/*var sig = document.getElementById("foxlinksSig").value;

	if (sig.match(/(\r\n|\r|\n).*\1/) || sig.length > 240)
		FOXLINKS_PROMPTSERVICE.alert(window, "FOXlinks Notice", "It seems your signature in FOXlinks is either longer than two lines or contains more than 240 characters/bytes. This makes LlamaGuy a very unhappy llama, and is not allowed.");
	else
		nsPreferences.setUnicharPref("foxlinks.sig", sig);*/

	var treeList   = {};
	var dblclickQuote = 0;

	checkboxes.forEach(function (element, index, array) {
		nsPreferences.setBoolPref("foxlinks." + element, document.getElementById("foxlinks" + element.charAt(0).toUpperCase() + element.substring(1)).checked);
	});

	strings.forEach(function (element, index, array) {
		if (element != "sig")
			nsPreferences.setUnicharPref("foxlinks." + element, document.getElementById("foxlinks" + element.charAt(0).toUpperCase() + element.substring(1)).value);
	});

	integers.forEach(function (element, index, array) {
		nsPreferences.setIntPref("foxlinks." + element, document.getElementById("foxlinks" + element.charAt(0).toUpperCase() + element.substring(1)).value);
	});

	dblclickQuote += (document.getElementById("foxlinksQuoteMsg").checked) ? FOXLINKS_QUOTE_MESSAGE : 0;
	dblclickQuote += (document.getElementById("foxlinksQuoteMsgTop").checked) ? FOXLINKS_QUOTE_MESSAGETOP : 0;
	nsPreferences.setIntPref("foxlinks.dblclickQuote", dblclickQuote);

	for (var i = 0; i < document.getElementById("foxlinksHighlightTree").childNodes.length; i++) {
		var j = document.getElementById("foxlinksHighlightTree").childNodes[i];
		treeList[j.childNodes[0].value] = { color: j.childNodes[1].color, text: j.childNodes[2].color, hide: j.childNodes[3].checked, posts: j.childNodes[4].checked, topics: j.childNodes[5].checked, links: j.childNodes[6].checked };
	}

	if (JSON)
		nsPreferences.setUnicharPref("foxlinks.newHighlight", JSON.stringify(treeList));
	else
		nsPreferences.setUnicharPref("foxlinks.newHighlight", treeList.toSource().match(/^\(?(.*?)\)?$/)[1]);
}

function foxlinksFillTree()
{
	while (document.getElementById("foxlinksHighlightTree").hasChildNodes())
		document.getElementById("foxlinksHighlightTree").removeChild(document.getElementById("foxlinksHighlightTree").firstChild);

	var treeList = {};

	try {
		if (JSON)
			treeList = JSON.parse(nsPreferences.copyUnicharPref("foxlinks.newHighlight"));
		else
			treeList = Components.utils.evalInSandbox("(" + nsPreferences.copyUnicharPref("foxlinks.newHighlight") + ")", sandbox);
	} catch (e) {}

	for (var i in treeList)
		foxlinksAddUser(i, treeList[i].color, treeList[i].text, treeList[i].hide, treeList[i].posts, treeList[i].topics, treeList[i].links);
}

function foxlinksAddUser(userName, color, text, hidden, posts, topics, links) {
	var newItem = document.createElement("richlistitem");
	var newTextbox = document.createElement("textbox");
	newTextbox.setAttribute("flex", "1");
	newTextbox.setAttribute("value", userName);
	newTextbox.setAttribute("label", "User");
	newTextbox.setAttribute("tooltiptext", "The username of the user you wish to highlight (case sensitive)");
	newItem.appendChild(newTextbox);
	var newBackgroundColorpicker = document.createElement("colorpicker");
	newBackgroundColorpicker.color = color;
	newBackgroundColorpicker.setAttribute("type", "button");
	newBackgroundColorpicker.setAttribute("label", "Background");
	newBackgroundColorpicker.setAttribute("tooltiptext", "The background color you want this user to be highlighted in");
	// Bug with setting colorpickers inside richlistitems
	setInterval(foxlinksFixColorpicker, 20, newBackgroundColorpicker);
	newItem.appendChild(newBackgroundColorpicker);
	var newTextColorpicker = document.createElement("colorpicker");
	newTextColorpicker.color = (typeof text == "string") ? text : "#000000";
	newTextColorpicker.setAttribute("type", "button");
	newTextColorpicker.setAttribute("label", "Text");
	newTextColorpicker.setAttribute("tooltiptext", "The color text you want this user to be highlighted in");
	setInterval(foxlinksFixColorpicker, 20, newTextColorpicker);
	newItem.appendChild(newTextColorpicker);
	var newHiddenCheck = document.createElement("checkbox");
	newHiddenCheck.checked = hidden;
	newHiddenCheck.setAttribute("label", "Hide");
	newHiddenCheck.setAttribute("tooltiptext", "Hide this user's posts by default");
	// Bug with setting checkboxes inside richlistitems
	newHiddenCheck.setAttribute("oncommand", "setTimeout(foxlinksFixCheckbox, 20, this)");
	setTimeout(foxlinksFixCheckbox, 20, newHiddenCheck);
	newItem.appendChild(newHiddenCheck);
	var newPostsCheck = document.createElement("checkbox");
	newPostsCheck.checked = posts;
	newPostsCheck.setAttribute("label", "Posts");
	newPostsCheck.setAttribute("tooltiptext", "Highlight messages in topics made by this user");
	newPostsCheck.setAttribute("oncommand", "setTimeout(foxlinksFixCheckbox, 20, this)");
	setTimeout(foxlinksFixCheckbox, 20, newPostsCheck);
	newItem.appendChild(newPostsCheck);
	var newTopicsCheck = document.createElement("checkbox");
	newTopicsCheck.checked = topics;
	newTopicsCheck.setAttribute("label", "Topics");
	newTopicsCheck.setAttribute("tooltiptext", "Highlight topics made by this user");
	newTopicsCheck.setAttribute("oncommand", "setTimeout(foxlinksFixCheckbox, 20, this)");
	setTimeout(foxlinksFixCheckbox, 20, newTopicsCheck);
	newItem.appendChild(newTopicsCheck);
	var newLinksCheck = document.createElement("checkbox");
	newLinksCheck.checked = (typeof links == "boolean") ? links : topics;
	newLinksCheck.setAttribute("label", "Links");
	newLinksCheck.setAttribute("tooltiptext", "Highlight links made by this user");
	newLinksCheck.setAttribute("oncommand", "setTimeout(foxlinksFixCheckbox, 20, this)");
	setTimeout(foxlinksFixCheckbox, 20, newLinksCheck);
	newItem.appendChild(newLinksCheck);
	document.getElementById("foxlinksHighlightTree").appendChild(newItem);
	return newItem;
}

function foxlinksFixColorpicker(colorpicker)
{
	colorpicker.mColorBox.style.setProperty("background-color", colorpicker.color, "important");
	colorpicker.setAttribute("color", colorpicker.color);
}

function foxlinksFixCheckbox(checkbox)
{
	if (checkbox.checked)
		checkbox.setAttribute("checked", "true");
	else
		checkbox.removeAttribute("checked");
}

function foxlinksAddNewUser()
{
	var newItem = foxlinksAddUser("", "#33CCFF", "#000000", false, true, true, true);
	newItem.firstChild.select();
	newItem.firstChild.focus();
	document.getElementById("foxlinksHighlightTree").ensureElementIsVisible(newItem);
}

function foxlinksDeleteSelected()
{
	if (document.getElementById("foxlinksHighlightTree").selectedItem)
		document.getElementById("foxlinksHighlightTree").removeChild(document.getElementById("foxlinksHighlightTree").selectedItem);
}

function foxlinksDeleteAll()
{
	while (document.getElementById("foxlinksHighlightTree").hasChildNodes())
		document.getElementById("foxlinksHighlightTree").removeChild(document.getElementById("foxlinksHighlightTree").firstChild);
}

function foxlinksCopyUser(numofcopies)
{
	if (!document.getElementById("foxlinksHighlightTree").selectedItem) {
		FOXLINKS_PROMPTSERVICE.alert(window, "FOXlinks Error", "No highlight rules set is highlighted.");
		return;
	}

	if (typeof numofcopies == "undefined") {
		while (1) {
			var input = { value: "6" };
			var check = { value: false };
			numofcopies = FOXLINKS_PROMPTSERVICE.prompt(window, "Copy Highlight Selection", "Enter the number of copies you would like to make.", input, null, check);

			if (numofcopies) {
				numofcopies = input.value;
			} else {
				return;
			}

			if (numofcopies.match(/[^0-9]/)) {
				FOXLINKS_PROMPTSERVICE.alert(window, "FOXlinks Error", "Value entered is not an interger value.");
			} else if (numofcopies == "") {
				return;
			} else {
				break;
			}
		}
	}

	numofcopies *= 1;
	var selection = document.getElementById("foxlinksHighlightTree").selectedItem;
	var focus;

	for (var i = 0; i < numofcopies; i++) {
		focus = foxlinksAddUser("", selection.childNodes[1].color, selection.childNodes[2].color, selection.childNodes[3].checked, selection.childNodes[4].checked, selection.childNodes[5].checked, selection.childNodes[6].checked);
	}
	
	document.getElementById("foxlinksHighlightTree").ensureElementIsVisible(focus);
}

function foxlinksFixStrings()
{
	var strings = ["foxlinks.blacklist", "foxlinks.highlight", "foxlinks.stylesheetLink"/*, "foxlinks.sig"*/];

	strings.forEach(function (element, index, array) {
		try {
			if (nsPreferences.copyUnicharPref(element) != "" && nsPreferences.copyUnicharPref(element).replace(/\\u[0-9A-F]{4}/ig) == "")
				nsPreferences.setUnicharPref(element, eval("\"" + nsPreferences.copyUnicharPref(element) + "\""));
		} catch (e) {}
	});
}
