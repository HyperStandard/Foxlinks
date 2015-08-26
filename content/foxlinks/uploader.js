var BatchUpLLoder = new function()
{
	var abort = true;
	var paths = [];
	var offset = 0;
	var abortBttn = null;
	var imageBox = null;

	this.uploadFiles = function(e)
	{
		getFiles(e.target);
		e.target.blur();
	};

	processUpload = function(target)
	{
		var doc = target.ownerDocument;
		if (!paths.length)
			return;

		abort = false;
		abortBttn = doc.createElement("input");
		abortBttn.id = "foxlinksAbortBttn";
		abortBttn.type = "button";
		abortBttn.value = "Abort Upload";
		abortBttn.addEventListener("click", abortUpload, false);
		var form = target.parentNode;
		form.appendChild(doc.createTextNode(" "));
		form.appendChild(abortBttn);
		imageBox = doc.getElementById("foxlinksUploadImageBox");
		if (!imageBox) {
			imageBox = doc.createElement("textarea");
			imageBox.readOnly = true;
			imageBox.id = "foxlinksUploadImageBox";
			imageBox.cols = 60;
			imageBox.rows = 6;
			imageBox.style.setProperty("position", "fixed", "");
			imageBox.style.setProperty("opacity", "0.8", "");
			imageBox.style.setProperty("bottom", "20px", "");
			imageBox.style.setProperty("right", "5px", "");
			imageBox.style.setProperty("z-index", "21", "");
			imageBox.addEventListener("click", function(e) { e.target.select(); }, false);
			doc.body.appendChild(imageBox);
			var closeBox = doc.createElement("a");
			closeBox.href = "#";
			closeBox.style.setProperty("display", "block", "");
			closeBox.style.setProperty("text-align", "center", "");
			closeBox.style.setProperty("position", "fixed", "");
			closeBox.style.setProperty("height", "13px", "");
			closeBox.style.setProperty("width", "13px", "");
			closeBox.style.setProperty("background", "url(data:image/gif;base64,R0lGODlhDQANAPcAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADQANAAAILwABBBhIsGAAgQINEkx4UGHDggwHRlxI0WHDiQoxGkRo8aFHiBtDZqzokGPHgwEBADs=)", "");
			closeBox.style.setProperty("border", "black 1px solid", "");
			closeBox.style.setProperty("bottom", (imageBox.offsetHeight + 20 - 13 - 1).toString() + "px", "");
			closeBox.style.setProperty("right", "5px", "");
			closeBox.style.setProperty("z-index", "22", "");
			closeBox.addEventListener("click", function(e) { e.preventDefault(); imageBox.parentNode.removeChild(imageBox); e.target.parentNode.removeChild(e.target); abortUpload(); }, false);
			doc.body.appendChild(closeBox);
		}

		doc.getElementById("foxlinksUploadBttn").disabled = true;
		doUpload(doc);
	}

	function getFiles(target)
	{
		var doc = target.ownerDocument;
		paths = [];
		filepicker = doc.createElement("input");
		filepicker.type = "file"
		filepicker.multiple = true;
		filepicker.accept = "image/*";
		filepicker.onchange = function() {
			paths = filepicker.files;
			processUpload(target);
		};
		filepicker.click();
	}

	function abortUpload()
	{
		abort = true;
		offset = 0;
		paths = [];

		if (abortBttn)
		{
			abortBttn.ownerDocument.getElementById("foxlinksUploadBttn").disabled = false;
			abortBttn.parentNode.removeChild(abortBttn);
			abortBttn = null;
		}
	}

	function doUpload(doc)
	{
		if (abort)
			return;

		var file = paths[offset];
		var form = new doc.defaultView.FormData();
		form.append("file", file)

		// need to use the compontent directly to get around CORS restrictions
		var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
		request.onreadystatechange = function() {
			if (request.readyState != 4)
				return;

			var img = request.responseText.match(/<input value="<img src=&quot;(.*?)&quot; \/>"/);

			if (img && request.responseText.indexOf("Errors were encountered processing one or more of your uploads") == -1)
				imageBox.value = imageBox.value + "<img src=\"" + img[1] + "\" />\n";
			else
				imageBox.value = imageBox.value + "[FILE UPLOAD \"" + file.leafName + "\" FAILED!]\n";

			offset++;

			if (paths.length > offset)
				doUpload(doc);
			else
				abortUpload();
		};

		request.open("POST", "http://u.endoftheinter.net/u.php", true);
		request.setRequestHeader("User-Agent", "FOXlinks Image Uploader 2.0");
		request.send(form);
	}
};
