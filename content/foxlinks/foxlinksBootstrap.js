(function() {
var globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

globalMM.loadFrameScript("chrome://foxlinks/content/foxlinksFrame.js", true);
globalMM.addMessageListener("foxlinks-select-tab", function(message) {
  gBrowser.selectTabAtIndex(gBrowser.getBrowserIndexForDocument(message.objects.tab));
});
})();
