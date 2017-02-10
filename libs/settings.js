// Simple logging function for debugging.
function debug() {
	console.log("[" + (new Date().toISOString().slice(0, 19).replace("T", " ")) + "]", ...arguments);
}

// Settings retrieved from the environment variables.
var settings = {
	debug: process.env.DEBUG ? debug : function () {},
	port: process.env.PORT,
	key: process.env.KEY,
	github: {
		repo: process.env.GITHUB_REPO,
		branch: process.env.GITHUB_BRANCH,
		token: process.env.GITHUB_TOKEN
	},
	trello: {
		key: process.env.TRELLO_KEY,
		token: process.env.TRELLO_TOKEN,
		boards: new Map(process.env.TRELLO_BOARDS.split(",").map(item => item.split(":")))
	},
	targets: new Map(process.env.TARGETS.split(",").map(item => item.split(":")))
};

exports.settings = settings;
