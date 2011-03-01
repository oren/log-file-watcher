/**
 * this module exports a function which parses the process.argv
 * and returns an object
 */


// I had fun a little with this =) it works as a real parser (as the one 
// JS in codemirror). there is a queue of functions parsing the flow of
// args. they can either deflect the arg (say that they're not the one 
// supposed to read this) or treat it and add other functions to the 
// queue
exports.parseArgs = function parseArgs() {
	var args = process.argv.splice(2);
	if(args.length == 0) throw new Error('No arguments to parse!');
	var port = args.pop(); // port is supposed to be the last argument
	// if it is a number then it's our port
	if(/\d+/.test(port)) { 
		
		port = parseInt(port);
	}
	// if it isn't, then it something else, we put it back
	else {
		args.push(port);
		port = null;
	}

	var res = {
		port: port,
		files: {
		}
	};
	var queue = [];

	function readFileName(arg) {
		// if it doesn't look like a filename
		if(! /[-a-zA-Z0-1\/._]+/.test(arg)) {
			// this is not meant for us
			console.log('readFileName :: rejecting %s', arg);
			return arg
		}
		queue.push(readAlias(arg));
	}

	function readAlias(filename) {
		// we return a closured function
		return function do_read_as(arg) {
			if(arg !== 'as') {
				// if this isn't the keyword 'as'
				// then there may not be an alias after all

				// so we store the filename and signify that this arg
				// is not for us
				res.files[filename] = filename;
				return arg;
			}
			// otherwise, the next arg is the alias
			queue.push(function do_readAlias(alias) {
				// here we read the actual alias
				// the alias should be a rather simple text
				// if there is no alias (ex: 'as' as the last argument)
				if(!alias) res.files[filename] = filename;
				// otherwise we've got it
				else res.files[alias] = filename;
			});
		}
	}
	function ignore(arg) {
		if(arg === null) return;
		queue.push(ignore);
	}

	queue.push(readFileName);
	while(args.length) {
		var f = queue.shift();
		var arg = args.shift();
		console.log('parsing %s using %s', arg, f.name);
		var r = f(arg);
		if(r) args.unshift(arg);
	}
	// flush the queue
	while(queue.length) {
		queue.shift()(null);
	}
	if(args.length) {
		console.log('There are some args left to parse')
		console.log(args);
	}
	return res;
}