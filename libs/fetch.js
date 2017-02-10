// Includes.
var http = require("http");
var https = require("https");
var url_parse = require("url").parse;

// Fetch trimmed down "polyfill".
function fetch (url, options = {}) {
	options = Object.assign(url_parse(url), options);

	return new Promise((resolve, reject) => {
		const lib = url.startsWith("https") ? https : http;
		const request = lib.request(options, response => {
			const body = [];
			response.on("data", chunk => body.push(chunk));
			response.on("end", () => resolve({
				url: url,
				status: response.statusCode,
				json: () => JSON.parse(body.join("")),
				text: () => body.join("")
			}));
		});
		request.on("error", (err) => reject(err));
		if (options.body) request.write(options.body);
		request.end();
	});
}

// Fetch some data and return it as JSON object.
// Throwing an error if the response status is not 200 or 201.
// TODO: Check if we need to handle redirections.
function fetchJSON (url, headers, method = "GET", body = null, success = [200, 201]) {
	return fetch(url, {headers, method, body}).then(response => {
		if (!success.includes(response.status)) {
			throw method + " request error " + response.status + " for " + url +  " with " + response.text();
		}
		return response.json();
	});
}

exports.fetch = fetch;
exports.fetchJSON = fetchJSON;
