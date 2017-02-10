var debug = require("./settings.js").settings.debug;

// Simple promise queue with a built-in throttling
// mecanism: the next task in the queue is executed
// after a fixed delay in seconds after the end of the previous task.
// Queued tasks are discarded if they were added before the
// previous one for the same target finished.
function Queue(delay) {
	// Queue is a promise to which we can append tasks.
	this.queue = Promise.resolve();
	// Runs stores the timestamp of the last jon runs for a given target.
	this.runs = {};
	// Delay is the time to wait after a job finishes.
	this.delay = (delay || 180) * 1000;

	// Creates a throttling promise used to delay the execution
	// of the next job.
	this.throttle = () => {
		// Logging.
		debug("Waiting " + (this.delay / 1000) + " seconds");
		// Promise with delayed resolution.
		return new Promise(resolve => {
			setTimeout(() => { debug("Ready"); resolve(); }, this.delay);
		});
	};

	// Add a job to the queue.
	this.enqueue = (target, job) => {
		// Task is a wrapper around the job to execute.
		var task;

		// Timestamp of the request.
		var time = new Date().getTime();

		// Logging.
		debug("Queueing job for " + target);

		// Basically we are creating a deferred promise
		// which only gets resolved or rejected when the
		// task is finished.
		var promise = new Promise((resolve, reject) => {
			task = () => {
				// Get the last run time for this target.
				var run = this.runs[target];

				// There has been no run for this target
				// or the previous one finished before this request
				// so we execute this request.
				if (run === undefined || run < time) {
					// Callback executed after the job is finished.
					var finisher = data => {
						// Logging.
						debug("Finished job for " + target);
						// Set the time of the last run for this target.
						this.runs[target] = new Date().getTime();
						// We wait before executing any other job.
						return this.throttle();
					};

					// Logging.
					debug("Starting job for " + target);
					// Execute the job then the finisher.
					resolve(Promise.resolve(job()).then(finisher).catch(finisher));
				}
				// The previous job for the same target finished
				// after this job was queued so we skip it.
				else {
					// Logging.
					debug("Skipping job for " + target);
					// Skip the job.
					resolve(Promise.resolve());
				}
			};
		});

		// Queue the task to be executed regardless of the result
		// of the previous task.
		this.queue.then(task).catch(task);

		// Set the queue to the new promise so that the next task
		// gets executed when this promise is resolved or rejected.
		this.queue = promise;
	};
}

exports.Queue = Queue;
