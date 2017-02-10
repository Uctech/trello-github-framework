// Includes.
var url_parse = require("url").parse;

// Application settings.
var settings = require("./libs/settings.js").settings;

// Work queue.
var Queue = new require("./libs/queue.js").Queue;

// Job handlers.
var handlers = {
	trello: require("./handlers/trello.js")
};

// Map of routes -> handlers.
var routes = new Map(Object.entries(require('./routes.json')).map(([key, value]) => {
	var [_, version] = key.split("/", 2);
	var path = key.substr(version.length + 2);
	var handler = handlers[value.handler];
	var parameters = value.parameters || [];

	return handler ? [key, handler.create(version, path, ...parameters)] : null;
}));

// Github user/organization targets.
var targets = settings.targets;

// Job queue with built-in 2 minutes throttling.
var queue = new Queue(120);

// Request validation.
function validateRequest(method, url) {
	if (method !== "GET") return false;
	if (!routes.has(url.pathname)) return false;
	if (url.query.key !== settings.key) return false;
	if (!url.query.target || !targets.has(url.query.target)) return false;
	return true;
}

// Logging.
settings.debug("Starting server, listening on port " + settings.port);

// Create a simple http server.
require("http").createServer(function (request, response) {
	var url = url_parse(request.url, true);

	if (!validateRequest(request.method, url)) {
		response.writeHead(400, {"Content-Type": "text/plain"});
		response.end("400 - Bad Request");
	}
	else {
		var handler = routes.get(url.pathname);
		var target = targets.get(url.query.target);
		// Queue the job.
		queue.enqueue(target + url.pathname, handler(target));
		// Return a 200 directly.
		response.writeHead(200, {"Content-Type": "text/plain"});
		response.end("200 - OK");
	}
}).listen(settings.port);
