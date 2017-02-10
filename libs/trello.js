var fetchJSON = require("./fetch.js").fetchJSON;

// Simple wrapper around the Trello data api.
function Trello (key, token) {
	this.url = "https://api.trello.com/1";

	this.headers = {};

	this.get = url => {
		return fetchJSON(url, this.headers);
	};

	this.boards = id => {
		if (!id) throw "Invalid Trello Board ID";

		var parameters = [
			"key=" + key,
			"token=" + token,
			"cards=open",
			"card_fields=name,desc,pos,idList,labels,due",
			"card_checklists=all",
			"lists=open",
			"fields=name,pos,desc",
			"card_attachments=true",
			"card_attachment_fields=name,url"
		].join("&");

		return this.get(this.url + "/boards/" + id + "?" + parameters);
	};
}

exports.Trello = Trello;
