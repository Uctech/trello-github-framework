var fetchJSON = require("../libs/fetch.js").fetchJSON;

// Github data api wrapper.
var Github = require("../libs/github.js").Github;

// Trello api wrapper.
var Trello = require("../libs/trello.js").Trello;

// Application settings.
var settings = require("../libs/settings.js").settings;

// Debug callback.
var debug = settings.debug;

// Create a new Trello api wrapper.
var trello = new Trello(settings.trello.key, settings.trello.token);

// Trello board id mapping.
var boards = settings.trello.boards;

// Process a card, adding its information to the given item.
function processCard(list, card) {
	var item = { link: {} }
	item.name = card.name;
	item.desc = card.desc;
	if (card.labels.length > 0) {
		item.category = card.labels[0].name;
	}
	if (card.attachments.length > 0) {
		item.link.url = card.labels[0].url;
		item.link.name = card.labels[0].name;
	}
	list.items[card.name] = item;
}

// Create a job handler.
function create(version, path, filename = "main") {
	return target => {
		return () => {
			// Create a new github api wrapper.
			var github = new Github(target, settings.github.token, settings.github.repo, version);

			// Get the Trello data.
			return Promise.all([
				trello.boards(boards.get('default')),
			])
			// Convert the trello board data.
			.then(data => {
				var board = data[0];

				// No data for the trello board (likely error).
				if (board.lists.length === 0 || board.cards.length === 0) {
					throw "No data retrieved from Trello";
				}

				// Logging.
				debug("Retrieved board " + board.name);

				// Map list id to object.
				var list_map = {};
				// List index.
				var index = 0;

				// Parse board lists.
				for (var i = 0, l = board.lists.length; i < l; i++) {
					var list = board.lists[i];
					if (list.name.toUpperCase() != "GUIDELINES") {

						list_map[list.id] = {
							index:		index,
							name:		list.name,
							items:		{}
						};
						index++;
					}
				}

				list = {}

				// Parse cards to retrieve data.
				for (var i = 0, l = board.cards.length; i < l; i++) {
					var card = board.cards[i];
					var list = list_map[card.idList];

					// Ignore cards which are not in a item list
					if (!list) {
						continue;
					}

					// Process the card adding details to the item.
					processCard(list, card);

					list_map[card.idList] = list;

					// Reset list variable.
					list = {}
				}

				// Logging.
				debug("list_map stringified " + JSON.stringify(list_map));

				// Check if the json file already exists.
				return [{path: path + "/" + filename + ".json", content: JSON.stringify(list_map)}];
			})
			// Commit files to github.
			.then(data => github.commit("Update data", data))
			// Display commit information from github.
			.then(data => { debug("Commit:", data.object.sha); return true; })
			// Do something in case of error.
			.catch(error => { debug("Error:", error); return true; });
		};
	};
}

exports.create = create;
