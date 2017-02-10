var fetchJSON = require("./fetch.js").fetchJSON;
var debug = require("./settings.js").settings.debug;

// Simple wrapper around the Github data api.
function Github(owner, token, repo, branch) {
	// We use a oauth token to connect to the github api.
	this.url = "https://" + token + ":x-oauth-basic@api.github.com/repos/" + owner + "/" + repo + "/git";

	// Github requests a user agent, that should be set
	// to the owner/organization or app name.
	// POST, PATCH, PUT requests also require to set the content type
	// of the sent payload (json in our case).
	this.headers = {"User-Agent": owner, "Content-Type": "application/json"};

	this.branch = branch;

	// Used for debugging.
	this.path = owner + "/" + repo + "/" + branch;

	this.get = url => {
		return fetchJSON(url, {"User-Agent": this.headers["User-Agent"]});
	};

	this.post = (url, body) => {
		return fetchJSON(url, this.headers, "POST", JSON.stringify(body));
	};

	this.patch = (url, body) => {
		return fetchJSON(url, this.headers, "PATCH", JSON.stringify(body));
	};

	this.blobs = {
		create: (content, encoding = "utf-8") => {
			return this.post(this.url + "/blobs", {content, encoding});
		}
	};

	this.heads = {
		get: branch => {
			return this.get(this.url + "/refs/heads/" + branch);
		},
		update: (branch, sha) => {
			return this.patch(this.url + "/refs/heads/" + branch, {sha});
		}
	};

	this.trees = {
		get: sha => {
			return this.get(this.url + "/trees/" + sha);
		},
		create: (tree, base_tree) => {
			return this.post(this.url + "/trees", {tree, base_tree});
		}
	};

	this.commits = {
		create: (message, tree, parents) => {
			return this.post(this.url + "/commits", {message, tree, parents});
		}
	};

	// Commit the given files to github.
	this.commit = (message, files) => {
		var _head;
		var _blobs;

		// Follow the flow described in the github data api documentation.
		// See https://developer.github.com/v3/git/
		return Promise.all(files.map(file => {
			// Generate a Blob for each file to commit.
			return this.blobs.create(file.content);
		}))
		.then(blobs => {
			_blobs = blobs;

			// Logging.
			debug("Generated " + blobs.length + " blobs for", this.path);

			// Get the head information for the given branch.
			return this.heads.get(this.branch);
		})
		.then(head => {
			_head = head;

			// Logging.
			debug("Retrieved head info for", this.path);

			// Get the tree information for the head.
			return this.trees.get(head.object.sha);
		})
		.then(tree => {
			// Logging.
			debug("Retrieved tree information for", this.path);

			// Create a new tree with the blob information.
			return this.trees.create(files.map((file, index) => ({
				// Ensure the path doesn't start with a slash as it's not allowed.
				// See https://developer.github.com/v3/git/trees/#create-a-tree.
				path: file.path.startsWith("/") ? file.path.substr(1) : file.path,
				mode: "100644",
				type: "blob",
				sha: _blobs[index].sha
			})), tree.sha);
		})
		.then(tree => {
			// Logging.
			debug("Created new tree information for", this.path);

			// Commit the tree information.
			return this.commits.create(
				message,
				tree.sha,
				[_head.object.sha]
			);
		})
		.then(commit => {
			// Logging.
			debug("Created commit for", this.path);

			// Push the commit.
			return this.heads.update(this.branch, commit.sha);
		});
	};
}

exports.Github = Github;
