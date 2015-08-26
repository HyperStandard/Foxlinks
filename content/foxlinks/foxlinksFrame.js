(function() {
var mozIJSSubScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
mozIJSSubScriptLoader.loadSubScript("chrome://foxlinks/content/foxlinksGlobals.js");
mozIJSSubScriptLoader.loadSubScript("chrome://foxlinks/content/uploader.js");
var Foxlinks = new function()
{
   var foxlinks_notify_listener = {
      observe: function(subject, topic, data)
      {
         if (topic != "alertclickcallback")
            return;

         sendAsyncMessage("foxlinks-select-tab", {}, {tab: foxlinks_tab});
         foxlinks_tab.defaultView.scrollTo(0, foxlinks_offset);
      }
   };

   var foxlinks_tab = null;
   var foxlinks_offset = 0;

   var XPathResult = null;

   function getHighlightList() {
      var highlightNames = {};
      var tempNames = {};

      try {
         if (JSON) {
            tempNames = JSON.parse(nsPreferences.copyUnicharPref("foxlinks.newHighlight"));
         } else {
            var sandbox = new Components.utils.Sandbox("about:blank");
            tempNames = Components.utils.evalInSandbox("(" + nsPreferences.copyUnicharPref("foxlinks.newHighlight") + ")", sandbox);
         }
      } catch(e) {}

      for (var i in tempNames) {
         var names = i.split(/\s*,\s*/);

         for (var j = 0; j < names.length; j++)
             highlightNames[names[j]] = { color: tempNames[i].color, text: tempNames[i].text, hide: tempNames[i].hide, posts: tempNames[i].posts, topics: tempNames[i].topics, links: tempNames[i].links };
      }

      return highlightNames;
   }

   this.OnLoad = function()
   {
      var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
      var foxlinksStyle = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService).newURI("chrome://foxlinks/content/foxlinksOverlay.css", null, null);

      if (!sss.sheetRegistered(foxlinksStyle, sss.USER_SHEET)) {
         sss.loadAndRegisterSheet(foxlinksStyle, sss.USER_SHEET);
      }

      if (nsPreferences.copyUnicharPref("foxlinks.newHighlight") == null ||
          nsPreferences.copyUnicharPref("foxlinks.newHighlight") == "")
         FOXLINKS_PROMPTSERVICE.alert(null, "FOXlinks Notice", "Please go into FOXlinks' options to configure the new highlighting method. If not, enjoy having this message pop-up in your face with every browser window you open. :)");

      CheckSigCrap();

      addEventListener("DOMContentLoaded", Process, true);
   };

   function CheckSigCrap()
   {
      var sig = nsPreferences.copyUnicharPref("foxlinks.sig");

      if (sig.match(/(\r\n|\r|\n).*\1/) || sig.length > 240) {
         nsPreferences.setUnicharPref("foxlinks.sig", "");
         FOXLINKS_PROMPTSERVICE.alert(null, "FOXlinks Notice", "It seems your signature in FOXlinks is either longer than two lines or contains more than 240 characters/bytes. This makes LlamaGuy a very unhappy llama, and your signature has been removed.");
      }
   }

   function Process(e)
   {
      if (nsPreferences.getBoolPref("foxlinks.shutdown"))
         return;

      var i, j, k, l, layout, currentSnap;
      var doc = e.originalTarget; // the target that initiated the load event
      XPathResult = doc.defaultView.XPathResult; // kind of a hack, whatevs

      // Make sure we're on a LUElinks
      try {
         if (!doc)
            return;
         else if (!doc.location)
            return;
         else if (!doc.location.host)
            return;
         else if (!doc.location.host.match(/^((www|archives|boards|images|links)\.)?(clouds\.)?endoftheinter\.net$/i))
            return;
         else if (doc.location.pathname == "/goreg.php" ||
                    doc.location.pathname == "/" ||
                    doc.location.pathname.match(/^\/img\//))
            return; // Leave the text-only pages alone
      } catch(e) {
         return;
      }

      switch (doc.body.className) {
         case "regular":
            layout = FOXLINKS_LAYOUT_TOPBAR;
            break;

         case "classic":
            layout = FOXLINKS_LAYOUT_CLASSIC;
            break;

         default:
            return;
      }

      CheckSigCrap();
      var highlightNames = getHighlightList();
      var head           = doc.getElementsByTagName("head")[0];
      var userid         = doc.cookie.match(/userid=([\-]?[0-9]+)/i); // OMG I'M LOOKING AT YOUR COOKIES!!!
      var globalStyles   = doc.createElement("style");
      globalStyles.type  = "text/css";

      if (doc.SmoothScroll)
      {
         doc.defaultView.clearInterval(doc.SmoothScroll);
         doc.SmoothScroll = null;
      }

      /*
       * Found out this way when converting the script to work as an Opera UserJS.
       * More complicated, but won't automatically break if LlamaGuy changes the
       * layout of the stylesheets.
       */

      var pageBg = doc.defaultView.getComputedStyle(doc.body, null).getPropertyValue("background-color");
      var bgColor = "#FFFFFF"

      var infobar = doc.evaluate('//div[@class="infobar"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      if (infobar)
         bgColor = doc.defaultView.getComputedStyle(infobar, null).getPropertyValue("background-color");

      var linkColor = doc.defaultView.getComputedStyle(doc.getElementsByTagName("a")[0], null).getPropertyValue("color");
      var linkVisited = doc.defaultView.getComputedStyle(doc.getElementsByTagName("a")[0], ":visited").getPropertyValue("color");
      var linkHover = doc.defaultView.getComputedStyle(doc.getElementsByTagName("a")[0], ":hover").getPropertyValue("color");
      var linkActive = doc.defaultView.getComputedStyle(doc.getElementsByTagName("a")[0], ":active").getPropertyValue("color");

      if (layout == FOXLINKS_LAYOUT_TOPBAR)
         var bgColor2 = doc.defaultView.getComputedStyle(doc.evaluate('//div[@class="menubar"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, null).getPropertyValue("background-color");
      else
         var bgColor2 = doc.defaultView.getComputedStyle(doc.getElementsByTagName("th")[0], null).getPropertyValue("background-color");

      var messageTopColor = null;
      var messageTop = doc.evaluate('//div[@class="message-top"] | //div[@class="messagetop"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      if (messageTop)
         messageTopColor = doc.defaultView.getComputedStyle(messageTop, null).getPropertyValue("background-color");

      if (doc.location.pathname == "/showmessages.php" ||
          doc.location.pathname == "/linkme.php" ||
         doc.location.pathname == "/inboxthread.php") {

         ProcessNewPosts({target: {ownerDocument: doc, firstChild: {className: "message-container"}}});

         if (doc.location.host != "archives.endoftheinter.net" &&
              !doc.body.innerHTML.match(/\<h2\>\<em\>.*?\<\/em\>\<\/h2\>/i)) {
            if (nsPreferences.getBoolPref("foxlinks.quickPost"))
               globalStyles.appendChild(doc.createTextNode("body:not(.quickpost-expanded) form.quickpost { display: block; position: static; } body:not(.quickpost-expanded) form.quickpost a.quickpost-nub { position: fixed; } body:not(.quickpost-expanded) form.quickpost div.quickpost-canvas { display: block; }"));

            if (nsPreferences.getBoolPref("foxlinks.switchButtonPositions")) {
               var postBttn = doc.evaluate('//input[@name="post"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
               postBttn.parentNode.removeChild(postBttn.previousSibling);
               postBttn.parentNode.insertBefore(postBttn, postBttn.previousSibling);
               postBttn.parentNode.insertBefore(doc.createTextNode(" "), postBttn.nextSibling);
            }
         }

            var msgContainer = doc.evaluate('//div[@class="message-container"][1]/..', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
         if (msgContainer)
         {
            //msgContainer.addEventListener("DOMNodeInserted", ProcessNewPosts, false);
            var postObserver = new doc.defaultView.MutationObserver(function(mutations) {
               mutations.forEach(function(mutation) {
                  ProcessNewPosts(mutation)
               });
            });
            postObserver.observe(msgContainer, {childList: true});
            //doc.getElementById("u0_3").addEventListener("DOMNodeInserted", GotoNewPage, false);
            var pageObserver = new doc.defaultView.MutationObserver(function(mutations) {
               mutations.forEach(function(mutation) {
                  GotoNewPage(mutation)
               });
            });
            pageObserver.observe(doc.getElementById("u0_3"), {childList: true});
         }

         if (nsPreferences.getBoolPref("foxlinks.livierlinks"))
         {
            var livierlinks = doc.createElement("a");
            livierlinks.href = "#autoupdate";
            livierlinks.id = "foxlinks-livierlinks";
            livierlinks.textContent = (doc.location.hash == "#autoupdate") ? "(On)" : "(Off)";
            livierlinks.title = "Automatically scroll and change pages in the topic";
            livierlinks.addEventListener("click", ToggleLivierLinks, false);
            doc.body.appendChild(livierlinks);
         }
      }

      var imageBttn = doc.evaluate('//input[@value="Upload Image"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      if (imageBttn && nsPreferences.getBoolPref("foxlinks.batchUploader")) {
         var batchBttn = doc.createElement("input");
         batchBttn.id = "foxlinksUploadBttn";
         batchBttn.type = "button";
         batchBttn.value = "Batch Upload";
         batchBttn.addEventListener("click", BatchUpLLoder.uploadFiles, false);
         imageBttn.parentNode.insertBefore(batchBttn, imageBttn.nextSibling);
         imageBttn.parentNode.insertBefore(doc.createTextNode(" "), imageBttn.nextSibling);
      }

      if (doc.getElementsByTagName("textarea").length >= 1 &&
           nsPreferences.getBoolPref("foxlinks.postButtons")) {
         var tAreas = doc.getElementsByTagName("textarea");

         for (i = 0; i < tAreas.length; i++) {
            if (tAreas[i].className === "V")
               continue;
            var bBttn = doc.createElement("input");
            bBttn.type = "button";
            bBttn.id = "b";
            bBttn.accessKey = "b";
            bBttn.name = "Bold";
            bBttn.value = "Bold";
            bBttn.addEventListener("click", Buttons, false);
            var iBttn = doc.createElement("input");
            iBttn.type = "button";
            iBttn.id = "i";
            iBttn.accessKey = "i";
            iBttn.name = "Italic";
            iBttn.value = "Italic";
            iBttn.addEventListener("click", Buttons, false);
            var uBttn = doc.createElement("input");
            uBttn.type = "button";
            uBttn.id = "u";
            uBttn.accessKey = "u";
            uBttn.name = "Underline";
            uBttn.value = "Underline";
            uBttn.addEventListener("click", Buttons, false);
            var preBttn = doc.createElement("input");
            preBttn.type = "button";
            preBttn.id = "pre";
            preBttn.accessKey = "p";
            preBttn.name = "Preformatted";
            preBttn.value = "Preformatted";
            preBttn.addEventListener("click", Buttons, false);
            var spoilerBttn = doc.createElement("input");
            spoilerBttn.type = "button";
            spoilerBttn.id = "spoiler";
            spoilerBttn.accessKey = "s";
            spoilerBttn.name = "Spoiler";
            spoilerBttn.value = "Spoiler";
            spoilerBttn.addEventListener("click", Buttons, false);
            var quoteBttn = doc.createElement("input");
            quoteBttn.type = "button";
            quoteBttn.id = "quote";
            quoteBttn.accessKey = "q";
            quoteBttn.name = "Quote";
            quoteBttn.value = "Quote";
            quoteBttn.addEventListener("click", Buttons, false);

            if (nsPreferences.getBoolPref("foxlinks.dancinJesus")) {
               var admBttn = doc.createElement("input");
               admBttn.type = "button";
               admBttn.id = "adm";
               admBttn.accessKey = "a";
               admBttn.name = "Admin";
               admBttn.value = "Admin";
               admBttn.addEventListener("click", Buttons, false);
               var modBttn = doc.createElement("input");
               modBttn.type = "button";
               modBttn.id = "mod";
               modBttn.accessKey = "m";
               modBttn.name = "Mod";
               modBttn.value = "Mod";
               modBttn.addEventListener("click", Buttons, false);
            }

            tAreas[i].parentNode.insertBefore(bBttn, tAreas[i]);
            tAreas[i].parentNode.insertBefore(doc.createTextNode(" "), tAreas[i]);
            tAreas[i].parentNode.insertBefore(iBttn, tAreas[i]);
            tAreas[i].parentNode.insertBefore(doc.createTextNode(" "), tAreas[i]);
            tAreas[i].parentNode.insertBefore(uBttn, tAreas[i]);
            tAreas[i].parentNode.insertBefore(doc.createTextNode(" "), tAreas[i]);
            tAreas[i].parentNode.insertBefore(preBttn, tAreas[i]);
            tAreas[i].parentNode.insertBefore(doc.createTextNode(" "), tAreas[i]);
            tAreas[i].parentNode.insertBefore(spoilerBttn, tAreas[i]);
            tAreas[i].parentNode.insertBefore(doc.createTextNode(" "), tAreas[i]);
            tAreas[i].parentNode.insertBefore(quoteBttn, tAreas[i]);

            if (nsPreferences.getBoolPref("foxlinks.dancinJesus")) {
               tAreas[i].parentNode.insertBefore(doc.createTextNode(" "), tAreas[i]);
               tAreas[i].parentNode.insertBefore(admBttn, tAreas[i]);
               tAreas[i].parentNode.insertBefore(doc.createTextNode(" "), tAreas[i]);
               tAreas[i].parentNode.insertBefore(modBttn, tAreas[i]);
            }

            tAreas[i].parentNode.insertBefore(doc.createElement("br"), tAreas[i]);
         }
      }

      var specialLinks = new Array (
         new Array("profile.php?user=" + userid[1], "My User Info Page", "ahahah look at this sperglord")
      );

      var userLinks = new Array (
         new Array("/tokenlist.php?user=" + userid[1] + "&type=2", "Good Tokens", "View all the Good Tokens users have given you"),
         new Array("/tokenlist.php?user=" + userid[1] + "&type=1", "Bad Tokens", "View all the Bad Tokens users have given you"),
         new Array("/editprofile.php", "Edit Profile", "Change your email address, signature, and not much else"),
         new Array("/editdisplay.php", "Edit Display", "Change the colors and layout of the site"),
         new Array("/editpass.php", "Edit Password", "hunter2"),
         new Array("/history.php" + (nsPreferences.getBoolPref("foxlinks.sortByTopicsLastPost") ? "?b" : ""), "View Posted Messages", "All that yelling that nobody paid attention to."),
         new Array("/links.php?mode=user&userid=" + userid[1], "View Added Links", "llamagay when are ya gonna fix links?"),
         new Array("/links.php?mode=comments", "View LUElink Comment History", "llamagay when are ya gonna fix links?"),
         new Array("/mytokens.php?user=" + userid[1], "View Available Tokens", "View the tokens you've given to other users"),
         new Array("/loser.php?userid=" + userid[1], "Loser", "View some stats about your LUElinks account"),
         new Array("/shop.php", "Enter The Token Shop", "Spend your Contribution tokens on random junk here"),
         new Array("/showfavorites.php", "View Tagged Topics", "View all those topics you tagged"),
         new Array("/inbox.php", "View Private Messages", "Oh BTW, FOXlinks snoops in your PMs now as well")
      );
      var tables = doc.getElementsByTagName("table");
      var trs	= doc.getElementsByTagName("tr");

      if (doc.location.pathname.match(/^\/topics\//) ||
          doc.location.pathname == "/inbox.php" ||
          doc.location.pathname == "/main.php" ||
          doc.location.pathname == "/history.php") {
         var historyPage = (doc.location.pathname == "/history.php");
         var powerTags = (doc.getElementsByTagName("th").length == 5 && !historyPage);
         var titleNode = powerTags ? 1 : 0;
         var postsNode = (powerTags) ? 3 : 2;
         var posterNode = (powerTags) ? 2 : 1;
         for (i = 0; i < trs.length; i++) {
            var cells = trs[i].getElementsByTagName("td");
            //if (doc.location.pathname == "/main.php" && (
            //     !doc.getElementsByTagName("h1")[1] ||
            //     !doc.getElementsByTagName("h1")[1].textContent.match(/Topics/i)))
            //   break;

            if ((trs[i].innerHTML.match(/<a href="[^"]*?showmessages(.+?)"/i) ||
                 trs[i].innerHTML.match(/<a href="[^"]*?inboxthread(.+?)"/i)) &&
                 !trs[i].getElementsByTagName("th")[0]) {
               var match = cells[titleNode].innerHTML.match(/topic=([0-9]+)/i);

               if (!match)
                  match = cells[titleNode].innerHTML.match(/thread=([0-9]+)/i);

               if (match &&
                    trs[i].childNodes.length >= 4) {

                  if (nsPreferences.getBoolPref("foxlinks.pageJump") &&
                      doc.location.pathname !== "/inbox.php") {
                     var match2 = cells[titleNode].innerHTML.match(/topic=([\-]?[0-9]+)/i);
                     var posts = Math.ceil(cells[postsNode].textContent.match(/^([0-9]+)/)[1] / 50);
                     var jump = doc.createElement("span");
                     jump.style.setProperty("font-weight", "bold", null);
                     jump.appendChild(doc.createTextNode(" "));
                     var jumper = doc.createElement("span");
                     jumper.className = "foxlinks-scrolljumper";
                     jumper.style.setProperty("white-space", "nowrap", "important");
                     jumper.style.setProperty("border", "1px solid black", "important");
                     jumper.style.setProperty("padding", "0 2px", "important");
                     jumper.style.setProperty("display", "none", "important");
                     jumper.style.setProperty("max-width", "300px", "important");
                     jumper.style.setProperty("overflow", "hidden", "important");
                     jumper.style.setProperty("text-indent", "0", "important");
                     jumper.style.setProperty("margin", "-2px 0.5em -4px 0", "important");
                     jumper.addEventListener("mousemove", PageJump, false);

                     for(l = 1; l <= posts; l++) {
                        if (l != 0)
                           jumper.appendChild(doc.createTextNode(" "));

                        var page = doc.createElement("a");

                        if (match2)
                           page.href = "/showmessages.php?topic=" + match[1] + "&page=" + l;
                        else
                           page.href = "/inboxthread.php?thread=" + match[1] + "&page=" + l;

                        page.appendChild(doc.createTextNode(l));
                        jumper.appendChild(page);
                     }
                     jump.appendChild(jumper);

                     var main = doc.createElement("a");

                     main.href = "#pagejump";
                     main.title = "Page Jump";
                     main.addEventListener("click", PageJumpExpandHide, false);
                     main.appendChild(doc.createTextNode("#"));
                     jump.appendChild(main);
                     jump.appendChild(doc.createTextNode(" "));
                     var last = doc.createElement("a");

                     if (match2)
                        last.href = "/showmessages.php?topic=" + match[1] + "&page=" + posts;
                     else
                        last.href = "/inboxthread.php?thread=" + match[1] + "&page=" + posts;

                     last.title = "Jump to last page in topic";
                     last.appendChild(doc.createTextNode(">"));
                     jump.appendChild(last);
                     if (cells[titleNode].getElementsByClassName("fr").length != 0) {
                        cells[titleNode].getElementsByClassName("fr")[0].appendChild(jump);
                     } else {
                        jump.style.setProperty("float", "right", "important");
                        var linkDiv = doc.createElement("div");
                        linkDiv.appendChild(cells[titleNode].firstChild);
                        cells[titleNode].appendChild(jump);
                        cells[titleNode].appendChild(linkDiv);
                     }
                  }

                  var posterName = cells[posterNode].firstChild.textContent;

                  if (posterName in highlightNames &&
                       highlightNames[posterName].topics) {
                     for (k = 0; k < cells.length; k++) {
                        cells[k].style.setProperty("background-color", highlightNames[posterName].color, "important");

                        if (highlightNames[posterName].text)
                           cells[k].style.setProperty("color", highlightNames[posterName].text, "important");
                     }
                  }
               }
            }
         }
      }

      if (doc.location.pathname == "/main.php" || (
          doc.location.pathname == "/links.php" &&
           !doc.getElementsByTagName("h1")[0].textContent.match(/^Links Added By:/i))) {
         for (i = 0; i < trs.length; i++) {
            if (doc.location.pathname == "/main.php" && (
                 !doc.getElementsByTagName("h1")[1] ||
                 !doc.getElementsByTagName("h1")[1].textContent.match(/Links/i)))
               break;

            if (trs[i].getElementsByTagName("td").length &&
                 trs[i].getElementsByTagName("td")[0].firstChild.pathname == "/linkme.php") {
               var cells = trs[i].getElementsByTagName("td");
               var posterName = cells[2].firstChild.textContent;

               if (posterName in highlightNames && ((
                    typeof highlightNames[posterName].links == "boolean" &&
                     highlightNames[posterName].links) || (
                    typeof highlightNames[posterName].links == "undefined" &&
                     highlightNames[posterName].topics)))
                  for (k = 0; k < cells.length; k++) {
                     cells[k].style.setProperty("background-color", highlightNames[posterName].color, "important");

                     if (highlightNames[posterName].text)
                        cells[k].style.setProperty("color", highlightNames[posterName].text, "important");
                  }
            }
         }
      }

      switch (nsPreferences.getIntPref("foxlinks.searchBox")) {
         case FOXLINKS_SEARCH_LINKME:
            var linkDiv = doc.createElement("div");
            linkDiv.className = "linkme";
            linkDiv.id = doc.body.className;
            var linkForm = doc.createElement("form");
            linkForm.action = "//" + ((doc.location.domain == "archives.endoftheinter.net") ? "links.endoftheinter.net" : doc.location.domain) + "/linkme.php";
            linkForm.method = "get";
            var linkText = doc.createElement("input");
            linkText.type = "text";
            linkText.name = "l";
            linkText.size = 10;
            linkForm.appendChild(linkText);
            linkForm.appendChild(doc.createTextNode(" "));
            var linkSubmit = doc.createElement("input");
            linkSubmit.type = "submit";
            linkSubmit.name = "submit";
            linkSubmit.value = "Link Me!";
            linkForm.appendChild(linkSubmit);
            linkDiv.appendChild(linkForm);
            doc.body.appendChild(linkDiv);
            break;

         case FOXLINKS_SEARCH_LINKS:
            var linkDiv = doc.createElement("div");
            linkDiv.className = "linkme";
            linkDiv.id = doc.body.className;
            var linkForm = doc.createElement("form");
            linkForm.action = "//" + ((doc.location.host == "archives.endoftheinter.net") ? "links.endoftheinter.net" : doc.location.host) + "/links.php";
            linkForm.method = "get";
            var linkText = doc.createElement("input");
            linkText.type = "text";
            linkText.name = "s_aw";
            linkText.size = 10;
            linkForm.appendChild(linkText);
            var linkMode = doc.createElement("input");
            linkMode.type = "hidden";
            linkMode.name = "mode";
            linkMode.value = "as";
            linkForm.appendChild(linkMode);
            var linkGo = doc.createElement("input");
            linkGo.type = "hidden";
            linkGo.name = "go";
            linkGo.value = "Search";
            linkForm.appendChild(linkGo);
            linkForm.appendChild(doc.createTextNode(" "));
            var linkSubmit = doc.createElement("input");
            linkSubmit.type = "submit";
            linkSubmit.value = "Search Links";
            linkForm.appendChild(linkSubmit);
            linkDiv.appendChild(linkForm);
            doc.body.appendChild(linkDiv);
            break;

         case FOXLINKS_SEARCH_WIKI:
            var linkDiv = doc.createElement("div");
            linkDiv.className = "linkme";
            linkDiv.id = doc.body.className;
            var linkForm = doc.createElement("form");
            linkForm.action = "//wiki.endoftheinter.net/index.php/Special:Search";
            linkForm.method = "get";
            var linkText = doc.createElement("input");
            linkText.type = "text";
            linkText.name = "search";
            linkText.size = 10;
            linkForm.appendChild(linkText);
            var linkGo = doc.createElement("input");
            linkGo.type = "hidden";
            linkGo.name = "go";
            linkGo.value = "Go";
            linkForm.appendChild(linkGo);
            linkForm.appendChild(doc.createTextNode(" "));
            var linkSubmit = doc.createElement("input");
            linkSubmit.type = "submit";
            linkSubmit.value = "Search LUEpedia";
            linkForm.appendChild(linkSubmit);
            linkDiv.appendChild(linkForm);
            doc.body.appendChild(linkDiv);
            break;

         case FOXLINKS_SEARCH_BOARDS:
            var linkDiv = doc.createElement("div");
            linkDiv.className = "linkme";
            linkDiv.id = doc.body.className;
            var linkForm = doc.createElement("form");
            linkForm.action = "//boards.endoftheinter.net/topics/LUE";
            linkForm.method = "get";
            var linkText = doc.createElement("input");
            linkText.type = "text";
            linkText.name = "q";
            linkText.size = 10;
            linkForm.appendChild(linkText);
            var linkSubmit = doc.createElement("input");
            linkSubmit.type = "submit";
            linkSubmit.value = "Search LUE";
            linkForm.appendChild(linkSubmit);
            linkDiv.appendChild(linkForm);
            doc.body.appendChild(linkDiv);
            break;

         default:
            break;
      }

      if (layout == FOXLINKS_LAYOUT_CLASSIC &&
           nsPreferences.getBoolPref("foxlinks.specialLinks")) {
         globalStyles.appendChild(doc.createTextNode(" li:hover > div, div.sdiv:hover > div { top: 0px !important; left: 0px !important; } ul.blist { margin: 0px; background-color: " + bgColor2 + "; position: absolute; }"));
         var ths = doc.getElementsByTagName("th");
         var theTh;

         if (ths[1].className == "classic3")
            theTh = ths[1];
         else
            theTh = ths[2];

         theTh.appendChild(doc.createElement("br"));
         theTh.appendChild(doc.createElement("br"));

         for (i = 0; i < specialLinks.length; i++) {
            var sDiv = doc.createElement("div");
            sDiv.className = "sdiv";
            var sLink = doc.createElement("a");
            sLink.className = "menubar";
            sLink.href = "#special";
            sLink.appendChild(doc.createTextNode(specialLinks[i][1]));

            if (specialLinks[i][0] == "#special")
               sLink.addEventListener("click", BoardLists, false);

            var sLinkDesc = doc.createElement("div");
            sLinkDesc.appendChild(doc.createTextNode(specialLinks[i][2]));
            sLinkDesc.className = "info";
            sDiv.appendChild(sLink);
            sDiv.appendChild(sLinkDesc);

            if (i == 0) {
               var uLinks = doc.createElement("a");
               uLinks.className = "menubar boardlist more";
               uLinks.href = "#special";
               uLinks.appendChild(doc.createTextNode("(more)>"));
               uLinks.addEventListener("click", BoardLists, false);
               sDiv.appendChild(uLinks);
               var linkList = doc.createElement("ul");
               linkList.className = "blist";
               linkList.style.setProperty("display", "none", "important");

               for (j = 0; j < userLinks.length; j++) {
                  var uLink = doc.createElement("a");
                  uLink.href = userLinks[j][0];
                  uLink.className = "menubar";
                  uLink.appendChild(doc.createTextNode(userLinks[j][1]));
                  var uLinkDesc = doc.createElement("div");
                  uLinkDesc.appendChild(doc.createTextNode(userLinks[j][2]));
                  var holdingL = doc.createElement("li");
                  holdingL.appendChild(uLink);
                  holdingL.appendChild(uLinkDesc);
                  linkList.appendChild(holdingL);
               }

               sDiv.appendChild(linkList);
            }

            theTh.appendChild(sDiv);
         }
      } else if (layout == FOXLINKS_LAYOUT_TOPBAR &&
                  nsPreferences.getBoolPref("foxlinks.specialLinks")) {
         var special = doc.createElement("div");
         special.className = "menubar special";
         special.id = "special";
         var list1 = doc.createElement("ul");
         list1.className = "menu";
         var item1 = doc.createElement("li");
         var boardsMenu0 = doc.createElement("a");
         boardsMenu0.className = "menubar boardlist";
         boardsMenu0.href = "#special";
         boardsMenu0.appendChild(doc.createTextNode("Special Links>"));
         boardsMenu0.addEventListener("click", BoardLists, false);
         item1.appendChild(boardsMenu0);
         var list2 = doc.createElement("ul");
         list2.style.setProperty("display", "none", "important");
         list2.style.setProperty("background-color", bgColor2, null);
         list2.className = "blist";

         for (i = 0; i < specialLinks.length; i++) {
            var sLink = doc.createElement("a");
            sLink.className = "menubar";
            sLink.href = specialLinks[i][0];

            if (specialLinks[i][0] == "#special")
               sLink.addEventListener("click", BoardLists, false);

            var sLinkDesc = doc.createElement("div");
            sLinkDesc.appendChild(doc.createTextNode(specialLinks[i][2]));
            sLink.appendChild(doc.createTextNode(specialLinks[i][1]));
            var hold = doc.createElement("li");
            hold.appendChild(sLink);
            hold.appendChild(sLinkDesc);

            if (i == 0) {
               var uLinks = doc.createElement("a");
               uLinks.className = "menubar boardlist more";
               uLinks.href = "#special";
               uLinks.appendChild(doc.createTextNode("(more)>"));
               uLinks.addEventListener("click", BoardLists, false);
               hold.appendChild(uLinks);
               var linkList = doc.createElement("ul");
               linkList.className = "blist";
               linkList.style.setProperty("display", "none", "important");
               linkList.style.setProperty("background-color", bgColor2, null);

               for (j = 0; j < userLinks.length; j++) {
                  var uLink = doc.createElement("a");
                  uLink.href = userLinks[j][0];
                  uLink.className = "menubar";
                  uLink.appendChild(doc.createTextNode(userLinks[j][1]));
                  var uLinkDesc = doc.createElement("div");
                  uLinkDesc.appendChild(doc.createTextNode(userLinks[j][2]));
                  var holdingL = doc.createElement("li");
                  holdingL.appendChild(uLink);
                  holdingL.appendChild(uLinkDesc);
                  linkList.appendChild(holdingL);
               }

               hold.appendChild(linkList);
            } else if (specialLinks[i][0] == "#special") {
               var linkList = doc.createElement("ul");
               linkList.className = "blist";
               linkList.style.setProperty("display", "none", "important");
               linkList.style.setProperty("background-color", bgColor2, null);

               for (j = 0; j < otherFiles.length; j++) {
                  var uLink = doc.createElement("a");
                  uLink.href = otherFiles[j][0];
                  uLink.className = "menubar";
                  uLink.appendChild(doc.createTextNode(otherFiles[j][1]));
                  var uLinkDesc = doc.createElement("div");
                  uLinkDesc.appendChild(doc.createTextNode(otherFiles[j][2]));
                  var holdingL = doc.createElement("li");
                  holdingL.appendChild(uLink);
                  holdingL.appendChild(uLinkDesc);
                  linkList.appendChild(holdingL);
               }

               hold.appendChild(linkList);
            }

            list2.appendChild(hold);
         }
         item1.appendChild(list2);
         list1.appendChild(item1);
         special.appendChild(list1);
         doc.body.appendChild(special);
      }

      var pres = doc.getElementsByTagName("pre");

      for (i = 0; i < pres.length; i++) {
         var lineBreaks = pres[i].getElementsByTagName("br");

         while (lineBreaks.length)
            lineBreaks[0].parentNode.removeChild(lineBreaks[0]);
      }

      var links = doc.getElementsByTagName("a");

      if (nsPreferences.getBoolPref("foxlinks.advancedSearch"))
         for (i = 0; i < links.length; i++) {
            if ((links[i].pathname == "/links.php" &&
                  links[i].search == "?mode=search") ||
                links[i].pathname == "/lsearch.php") {
               links[i].href = "lsearch.php?a";

               if (doc.location.pathname != "/showtopics.php")
                  break;
            }

            if (doc.location.pathname == "/showtopics.php" &&
                 links[i].pathname == "/search.php") {
               links[i].href = "search.php?as&" + links[i].search.substring(1);
               break;
            }
         }

      if (nsPreferences.getBoolPref("foxlinks.sortByTopicsLastPost"))
         for (i = 0; i < links.length; i++)
            if (doc.location.pathname == "/profile.php" &&
                 links[i].pathname == "/history.php" &&
                  links[i].search == "") {
               links[i].href="history.php?b";
               break;
            }

      for (i = 0; i < links.length; i++) {
         try {
            if (links[i].host == doc.location.host &&
               links[i].pathname == "/l.php")
               links[i].href = links[i].search.substring(1) + (("hash" in links[i]) ? links[i].hash : "");
         } catch (e) {}
      }

      if (nsPreferences.getBoolPref("foxlinks.awesomeQuotes") &&
           messageTopColor)
         globalStyles.appendChild(doc.createTextNode(".quoted-message { border: " + messageTopColor + " 2px solid; padding-left: 0; margin: 0 30px 2px 30px; -moz-border-radius: 5px; padding-left: 3px; } .quoted-message .message-top { background-color: " + messageTopColor + "; margin-top: -2px !important; margin-left: -3px !important; -moz-border-radius: 3px 3px 0 0;}"));

      if (nsPreferences.copyUnicharPref("foxlinks.stylesheetLink") != "")
         globalStyles.appendChild(doc.createTextNode(nsPreferences.copyUnicharPref("foxlinks.stylesheetLink")));

      if (globalStyles.firstChild) {
         globalStyles.firstChild.normalize();
         head.appendChild(globalStyles);
      }

      if (nsPreferences.getBoolPref("foxlinks.disableMainStyle"))
         doc.styleSheets[0].disabled = true;
   }

   function PageJumpExpandHide(e)
   {
      e.preventDefault();
      var ele = e.target.previousSibling;

      if (ele.style.getPropertyValue("display") == "none")
         ele.style.setProperty("display", "inline-block", "important");
      else
         ele.style.setProperty("display", "none", "important");
   }

   function PageJump(e)
   {
      var element = e.originalTarget;

      while (element.className != "foxlinks-scrolljumper")
         element = element.parentNode;

      var actualWidth = element.scrollWidth + element.style.getPropertyValue("text-indent").match(/[0-9]+/)[0] * 1;

      var offsetLeft = 0;
      var offsetElement = element;

      while (offsetElement) {
         offsetLeft += offsetElement.offsetLeft;
         offsetElement = offsetElement.offsetParent;
      }

      var offset = actualWidth * ((e.pageX - offsetLeft) / element.clientWidth) - element.clientWidth / 2;

      if (offset < 0)
         offset = 0;
      else if (offset > actualWidth - element.clientWidth + 2)
         offset = actualWidth - element.clientWidth;

      offset = -offset;
      element.style.setProperty("text-indent", offset + "px", "important");
   }

   function BoardLists(e)
   {
      e.preventDefault();

      if (e.target.parentNode.lastChild.style.getPropertyValue("display") == "") {
         e.target.parentNode.lastChild.style.setProperty("opacity", "0.9", "important");
         setTimeout(MenuFadeOut, 20, e.target.parentNode.lastChild);
      } else {
         e.target.parentNode.lastChild.style.removeProperty("display");
         e.target.parentNode.lastChild.style.setProperty("opacity", "0.1", "important");
         setTimeout(MenuFadeIn, 20, e.target.parentNode.lastChild);
      }

      this.blur();
   }

   function MenuFadeIn(node)
   {
      if (node.style.getPropertyValue("opacity") != "1") {
         if (node.nodeName.toLowerCase() == "div")
            node.style.removeProperty("display");

         node.style.setProperty("opacity", ((node.style.getPropertyValue("opacity") * 1) + 0.1), "important");
         setTimeout(MenuFadeIn, 20, node);
      } else if (node.nodeName.toLowerCase() == "div") {
         node.style.removeProperty("opacity");
         return;
      }
   }

   function MenuFadeOut(node)
   {
      var i;

      if (node.style.getPropertyValue("opacity") == "0") {
         if (node.nodeName.toLowerCase() == "div" && !node.className.match("sdiv")) {
            node.style.setProperty("display", "none", "important");
            node.style.removeProperty("opacity");
            return;
         }

         var uLists = node.getElementsByTagName("ul");

         for (i = 0; i < uLists.length; i++) {
            if (uLists[i].firstChild.nodeName.toLowerCase() == "#text")
               break;

            uLists[i].style.setProperty("display", "none", "important");
         }

         node.style.removeProperty("opacity");
         node.style.setProperty("display", "none", "important");
      } else {
         node.style.setProperty("opacity", ((node.style.getPropertyValue("opacity") * 1) - 0.1), "important");
         setTimeout(MenuFadeOut, 20, node);
      }
   }

   function Buttons(e)
   {
      var tag	= e.target.id;
      var open   = new RegExp("\\*", "m");
      var ta	 = e.target.nextSibling;

      while (ta.nodeName.toLowerCase() != "textarea")
         ta = ta.nextSibling;

      var st	 = ta.scrollTop;
      var before = ta.value.substring(0, ta.selectionStart);
      var after  = ta.value.substring(ta.selectionEnd, ta.value.length);
      var select = ta.value.substring(ta.selectionStart, ta.selectionEnd);

      if (ta.selectionStart == ta.selectionEnd) {
         if (open.test(e.target.value)) {
            e.target.value = e.target.name;
            var focusPoint = ta.selectionStart + tag.length + 3;
            ta.value = before + "</" + tag + ">" + after;
         } else {
            e.target.value = e.target.name + "*";
            var focusPoint = ta.selectionStart + tag.length + 2;
            ta.value = before + "<" + tag + ">" + after;
         }

         ta.selectionStart = focusPoint;
      } else {
         var focusPoint = ta.selectionStart + (tag.length * 2) + select.length + 5;
         ta.value = before + "<" + tag + ">" + select + "</" + tag + ">" + after;
         ta.selectionStart = before.length;
      }

      ta.selectionEnd = focusPoint;
      ta.scrollTop = st;
      ta.focus();
   }

   function Blacklist(e)
   {
      e.preventDefault();

      if (e.target.parentNode.nextSibling.style.getPropertyValue("display") == "none") {
         e.target.parentNode.nextSibling.style.removeProperty("display");
         e.target.replaceChild(e.target.ownerDocument.createTextNode("Hide"), e.target.firstChild);
         e.target.parentNode.nextSibling.style.setProperty("opacity", "0.1", "important");
         setTimeout(MenuFadeIn, 20, e.target.parentNode.nextSibling);
      } else {
         this.replaceChild(e.target.ownerDocument.createTextNode("Show"), e.target.firstChild);
         this.parentNode.nextSibling.style.setProperty("opacity", "0.9", "important");
         setTimeout(MenuFadeOut, 20, e.target.parentNode.nextSibling);
      }
   }

   function InlineImageExpansion(e)
   {
      if (e.button != 0)
         return;

      var doc = e.target.ownerDocument;

      var imglink = e.currentTarget;

      var thumb = imglink.firstChild.firstChild;
      var inline;

      if (thumb.nodeName.toUpperCase() !== "IMG" || !thumb.src.match(/\/i\/t\//))
         return;

      if (imglink.firstChild.childNodes.length == 1) {
         inline = doc.createElement("img");
         inline.src = imglink.getAttribute("imgsrc");
         inline.addEventListener("error", InlineImageError, false);
         inline.addEventListener("abort", InlineImageError, false);
         imglink.firstChild.appendChild(inline);
      } else
         inline = imglink.firstChild.childNodes[1];

      if (thumb.style.getPropertyValue("display") != "none") {
         thumb.style.setProperty("display", "none", "important");
         inline.style.removeProperty("display");
         imglink.firstChild.className += " foxlinks-expanded";
      } else {
         thumb.style.removeProperty("display");
         inline.style.setProperty("display", "none", "important");
         imglink.firstChild.className = imglink.firstChild.className.replace("foxlinks-expanded", "");
      }

      e.preventDefault();
      e.currentTarget.blur();
   }

   function InlineImageError(e)
   {
      var link = e.target.parentNode;
      link.childNodes[0].style.removeProperty("display");
      link.removeChild(link.childNodes[1]);
   }

   function ProcessNewPosts(e)
   {
      // Ugly hack for removing duplicate images loaded with livelinks for some reason, which without FOXlinks simply get cut off
      if (e.target.nodeName && e.target.nodeName.toUpperCase() == "IMG" && e.target.previousSibling && e.target.previousSibling.nodeName.toUpperCase() == "IMG" &&
         e.target.src == e.target.previousSibling.src) {
         e.target.parentNode.removeChild(e.target);
         return;
      }

      if (!e.target.firstChild || (e.target.firstChild.className != "message-container" && e.target.className != "message-container"))
         return;

      var doc = e.target.ownerDocument;
      var page = doc.location.search.match(/([?&]|^)page=([0-9]+)(&|$)/);
      var alerted = doc.hasFocus();
      var userid = doc.cookie.match(/userid=([\-]?[0-9]+)/i);
      var threadedPage = !!doc.location.search.match(/([?&]|^)thread=[0-9].*?([=&]|$)/);

      if (page)
         page = page[2] != "0" ? page[2] : 1;
      else
         page = 1;

      var postNum = (page - 1) * 50 + 1 + doc.evaluate('count(//*[@class!="quoted-message" and @id!="m"]/div[@class="message-top" and @foxlinks-processed] | //*[@class!="quoted-message" and @id!="m"]/div[@class="messagetop" and @foxlinks-processed])', doc, null, XPathResult.NUMBER_TYPE, null).numberValue;
      var messagetopDivs = doc.evaluate('//*[@class!="quoted-message"]/div[@class="message-top" and not(@foxlinks-processed)] | //*[@class!="quoted-message"]/div[@class="messagetop" and not(@foxlinks-processed)]', doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

      for (var i = 0; i < messagetopDivs.snapshotLength; i++, postNum++)
      {
         var currentSnap = messagetopDivs.snapshotItem(i);
         currentSnap.setAttribute("foxlinks-processed", "true");

         if (currentSnap.getElementsByTagName("a").length == 1) // skip non-post messagetop
            continue;

         var filterPage = (doc.location.search.match(/([?&]|^)u([=&]|$)/) || currentSnap.getElementsByTagName("b").length < 2);
         var highlightNames = getHighlightList();

         var posterName = currentSnap.getElementsByTagName("a")[0];

         if (!posterName.href.match("profile.php"))
            posterName = currentSnap.textContent.match(/^From: ([^|]*) | Posted: /)[1];
         else
            posterName = posterName.textContent;

         var nextDiv = currentSnap.nextSibling;

         while (nextDiv.nodeName.toLowerCase() == "#text")
            nextDiv = nextDiv.nextSibling;

         if (nextDiv.nodeName.toUpperCase() != "DIV")
            nextDiv = doc.evaluate('//td[@class="message"]', nextDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;


         if(nsPreferences.getIntPref("foxlinks.dblclickQuote") & FOXLINKS_QUOTE_MESSAGETOP)
            currentSnap.setAttribute("ondblclick", "return QuickPost.publish('quote', this.firstChild);");

         if(nsPreferences.getIntPref("foxlinks.dblclickQuote") & FOXLINKS_QUOTE_MESSAGE)
            currentSnap.nextSibling.setAttribute("ondblclick", "return QuickPost.publish('quote', this.previousSibling.firstChild);");

         if (!filterPage &&
              posterName in highlightNames &&
              highlightNames[posterName].hide) {
            currentSnap.appendChild(doc.createTextNode(" | "));
            var toggle = doc.createElement("a");
            toggle.href = "#showhidepost";
            toggle.appendChild(doc.createTextNode("Show"));
            toggle.addEventListener("click", Blacklist, false);
            currentSnap.appendChild(toggle);
            currentSnap.nextSibling.style.setProperty("display", "none", "important");
         }

         if (!filterPage &&
              posterName in highlightNames &&
              highlightNames[posterName].posts) {
            currentSnap.style.setProperty("background-color", highlightNames[posterName].color, "important");

            if (highlightNames[posterName].text) {
               currentSnap.style.setProperty("color", highlightNames[posterName].text, "important");
               var headerLinks = currentSnap.getElementsByTagName("a");

               for (var j = 0; j < headerLinks.length; j++)
                  headerLinks[j].style.setProperty("color", highlightNames[posterName].text, "important");
            }

            if (nsPreferences.getBoolPref("foxlinks.notificationsHighlighted") && !alerted && !highlightNames[posterName].hide) {
               alerted = true;
               foxlinks_tab = doc;
               foxlinks_offset = currentSnap.offsetTop - 2;

               try {
                  FOXLINKS_ALERTSERVICE.showAlertNotification("chrome://foxlinks/content/foxlinksIcon.png", posterName + " made a post!", FOXLINKS_NOTIFYMESSAGES.PostMessage(), true, "", foxlinks_notify_listener, "foxlinks-notify");
               } catch (e) {
                  FOXLINKS_PROMPTSERVICE.alert(null, "FOXlinks Notice", "Cannot display notifications on this computer. If you're on a Mac, try installing Growl and restarting Firefox.");
               }
            }
         }

         if (!filterPage && !threadedPage && nsPreferences.getBoolPref("foxlinks.messageNumbering"))
            currentSnap.appendChild(doc.createTextNode(" | #" + "0000".substr(0, 4 - postNum.toString().length) + postNum.toString()));
         else
            postNum--;
      }

      var quotes = doc.evaluate('//div[@class="quoted-message"]/div[@class="message-top" and not(@foxlinks-processed)]', doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

      for (var i = 0; i < quotes.snapshotLength; i++) {
         var currentQuote = quotes.snapshotItem(i);
         currentQuote.setAttribute("foxlinks-processed", "true");

         var quoteNameNode = currentQuote.getElementsByTagName("a")[0];

         if (!quoteNameNode)
            continue;

         var quoteName = quoteNameNode.textContent;

         if (nsPreferences.getBoolPref("foxlinks.notificationsQuoted") && !alerted && quoteNameNode.href.match(/user=([0-9]+)/)[1] == userid[1]) {
            alerted = true;
            foxlinks_tab = doc;
            var origpost = currentQuote.parentNode;

            while (origpost.className != "message-container")
               origpost = origpost.parentNode;

            var posterName = origpost.getElementsByClassName("message-top")[0].getElementsByTagName("a")[0].textContent;
            foxlinks_offset = origpost.offsetTop - 2;

            try {
               FOXLINKS_ALERTSERVICE.showAlertNotification("chrome://foxlinks/content/foxlinksIcon.png", posterName + " quoted you!", FOXLINKS_NOTIFYMESSAGES.QuoteMessage(), true, "", foxlinks_notify_listener, "foxlinks-notify");
            } catch (e) {
               FOXLINKS_PROMPTSERVICE.alert(null, "FOXlinks Notice", "Cannot display notifications on this computer. If you're on a Mac, try installing Growl and restarting Firefox.");
            }
         }

         if (quoteName in highlightNames &&
             highlightNames[quoteName].hide) {
            currentQuote.appendChild(doc.createTextNode(" | "));
            var toggle = doc.createElement("a");
            toggle.href = "#showhidepost";
            toggle.appendChild(doc.createTextNode("Show"));
            toggle.addEventListener("click", Blacklist, false);
            currentQuote.appendChild(toggle);
            var holdingDiv = doc.createElement("div");
            var nodes = currentQuote.nextSibling;

            while (nodes) {
               var nextNode = nodes.nextSibling;
               holdingDiv.appendChild(nodes);
               nodes = nextNode;
            }

            currentQuote.parentNode.appendChild(holdingDiv);
            holdingDiv.style.setProperty("display", "none", "important");
         }

         if (nsPreferences.getBoolPref("foxlinks.jumpToQuote")) {
            var jumpToLink = doc.createElement("a");
            jumpToLink.href = "#jumpto";
            jumpToLink.title = "Jump to the original post of this quote.";
            jumpToLink.addEventListener("click", ScrollToQuote, false);
            jumpToLink.appendChild(doc.createTextNode("Goto"));
            currentQuote.appendChild(doc.createTextNode(" | "));
            currentQuote.appendChild(jumpToLink);
         }

         if (quoteName in highlightNames &&
             highlightNames[quoteName].posts &&
              nsPreferences.getBoolPref("foxlinks.highlightQuotes")) {
            if (nsPreferences.getBoolPref("foxlinks.awesomeQuotes"))
               currentQuote.style.setProperty("background-color", highlightNames[quoteName].color, "important");
            currentQuote.parentNode.style.setProperty("border-color", highlightNames[quoteName].color, "important");

            if (highlightNames[quoteName].text &&
                nsPreferences.getBoolPref("foxlinks.awesomeQuotes")) {
               currentQuote.style.setProperty("color", highlightNames[quoteName].text, "important");
               var quoteLinks = currentQuote.getElementsByTagName("a");

               for (var k = 0; k < quoteLinks.length; k++)
                  quoteLinks[k].style.setProperty("color", highlightNames[quoteName].text, "important");
            }
         }
      }

      if (nsPreferences.getBoolPref("foxlinks.inlineImageExpansion")) {
         var uploadedImages = doc.evaluate('//div[@class="imgs"]/a[not(@foxlinks-processed)]', doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

         for (var i = 0; i < uploadedImages.snapshotLength; i++) {
            var imageLink = uploadedImages.snapshotItem(i);
            imageLink.setAttribute("foxlinks-processed", "true");
            imageLink.removeAttribute("target");
            imageLink.addEventListener("click", InlineImageExpansion, false);
         }
      }

      if (nsPreferences.getBoolPref("foxlinks.livierlinks") && doc.location.hash == "#autoupdate")
      {
         var posts = doc.getElementById("u0_4");

         if (doc.SmoothScroll)
            doc.defaultView.clearInterval(doc.SmoothScroll);

         doc.SmoothScroll = doc.defaultView.setInterval(SmoothScroll, 10, doc, posts.offsetTop + posts.offsetHeight - doc.defaultView.innerHeight + 2);
      }
   }

   function ScrollToQuote(e) {
      e.preventDefault();
      var currentQuote = e.target.parentNode.textContent;
      currentQuote = currentQuote.substring(0, currentQuote.length - 7);

      if (currentQuote.substr(-7) == " | Show" || currentQuote.substr(-7) == " | Hide")
         currentQuote = currentQuote.substring(0, currentQuote.length - 7);

      var doc = e.target.ownerDocument;
      var posts = doc.evaluate('//div[@class="message"] | //table[@class="message-body"]', doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

      for (var i = 0; i < posts.snapshotLength; i++) {
         var messageHead = posts.snapshotItem(i).previousSibling;

         while (messageHead.nodeName.toLowerCase() != "div")
            messageHead = messageHead.previousSibling;

         if (messageHead.textContent.indexOf(currentQuote) != -1) {
            messageHead.scrollIntoView();
            return;
         }
      }

      var cantFindMessage = doc.createElement("span");
      cantFindMessage.style.setProperty("cursor", "help", "important");
      var textColor = doc.defaultView.getComputedStyle(e.target.parentNode, null).getPropertyValue("color");
      cantFindMessage.style.setProperty("border-bottom", "1px dotted " + textColor, "important");
      cantFindMessage.style.setProperty("display", "inline-block", null);
      cantFindMessage.style.setProperty("line-height", "0.9em", null);
      cantFindMessage.title = "The original message most likely appears on a previous page, and FOXlinks can't link to it from here.";
      cantFindMessage.appendChild(doc.createTextNode("Can't Find Message"));
      e.target.parentNode.appendChild(cantFindMessage);
      e.target.parentNode.removeChild(e.target);
   }

   function ToggleLivierLinks(e)
   {
      var doc = e.target.ownerDocument;
      e.target.textContent = (doc.location.hash == "#autoupdate") ? "(Off)" : "(On)";
      e.target.href = (doc.location.hash == "#autoupdate") ? "#off" : "#autoupdate";

      if (doc.location.hash == "#autoupdate")
      {
         doc.defaultView.clearInterval(doc.SmoothScroll);
         doc.SmoothScroll = null;
      }
   }

   function SmoothScroll(doc, offset)
   {
      var win = doc.defaultView;

      if (win.pageYOffset >= offset) {
         win.clearInterval(doc.SmoothScroll);
         doc.SmoothScroll = null;
         return;
      }

      win.scrollBy(0, Math.ceil((offset - win.pageYOffset) / 10));
   }

   function GotoNewPage(e)
   {
      var doc = e.target.ownerDocument;
      var page = doc.location.search.match(/([?&]|^)page=([0-9]+)(&|$)/);

      if (page)
         page = page[2] != "0" ? page[2] : 1;
      else
         page = 1;

      if (nsPreferences.getBoolPref("foxlinks.livierlinks") && doc.location.hash == "#autoupdate" && !doc.body.className.match(/quickpost-expanded/))
      {
         var newPage = doc.evaluate('//div[@id="u0_3"]/a[last()]', doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

         if (newPage.snapshotLength > 0)
         {
            newPage = newPage.snapshotItem(newPage.snapshotLength - 1);

            if (newPage && newPage.nodeName.toUpperCase() == "A" && newPage.href.match(/&page=([0-9]+)/) && newPage.href.match(/&page=([0-9]+)/)[1] * 1 > page * 1)
            {
               if (doc.SmoothScroll)
               {
                  doc.defaultView.clearInterval(doc.SmoothScroll);
                  doc.SmoothScroll = null;
               }

               doc.location = newPage.href + "#autoupdate";
               return;
            }
         }
      }
   }
};

Foxlinks.OnLoad();
})();
