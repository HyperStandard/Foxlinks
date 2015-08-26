// Load the nsPreferences helper object
Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://global/content/nsUserSettings.js");

// Shortcut for the services
const FOXLINKS_PROMPTSERVICE = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
const FOXLINKS_ALERTSERVICE = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);

const FOXLINKS_NOTIFYMESSAGES = {
	PostMessage: function()
	{
		var mess = [
			"It's probably pretty shitty.",
			"Doubt it's worth reading though.",
			"It's actually just Goatse.",
			"Get your browser over there and brace for disappointment."
		];

		return mess[Math.floor(Math.random() * mess.length)];
	},

	QuoteMessage: function()
	{
		var mess = [
			"I heard he called you a lamer.",
			"It was probably just a mistake.",
			"It's actually just Goatse.",
			"Brace your ego for a full-on assault."
		];

		return mess[Math.floor(Math.random() * mess.length)];
	}
};

// Values for type of search in the page corner
const FOXLINKS_SEARCH_LINKME = 1;
const FOXLINKS_SEARCH_LINKS  = 2;
const FOXLINKS_SEARCH_WIKI   = 3;
const FOXLINKS_SEARCH_BOARDS = 4;

// Values for the site layouts
const FOXLINKS_LAYOUT_TOPBAR  = 1;
const FOXLINKS_LAYOUT_CLASSIC = 2;

// Bits for foxlinks.dblclickQuote
const FOXLINKS_QUOTE_MESSAGETOP = 1;
const FOXLINKS_QUOTE_MESSAGE    = 2;
