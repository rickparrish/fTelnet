const async = require('async');
const fs = require('fs');
const jsmin = require('jsmin').jsmin;

// From: https://stackoverflow.com/a/43728722/342378
function combineFiles(inputFilenames, outputFilename) {
	return new Promise((resolve, reject) => {
		// Read all files in parallel
		async.map(inputFilenames, fs.readFile, (err, results) => {
			if (err) {
				throw err;
			}

			//Write the joined results to destination
			fs.writeFile(outputFilename, results.join('\r\n'), (err) => {
				if (err) {
					throw err;
				}

				console.log('Combined files into ' + outputFilename);
				
				resolve();
			});
		});
	});
}

function fixEnumerable(filename) {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, 'utf8', function (err,data) {
			if (err) {
				throw err;
			}
		  
			data = data.replace(/enumerable[:] false/g, 'enumerable: true');
			fs.writeFile(filename, data, function (err) {
				if (err) {
					throw err;
				}
				
				console.log("Fixed 'enumerable: false' in " + filename);
				
				resolve();
			});
		});
	});
}

function minifyFile(filename) {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, 'utf8', function (err,data) {
			if (err) {
				throw err;
			}
		  
			data = jsmin(data);
			const newFilename = filename.substr(0, filename.lastIndexOf(".")) + ".min.js";
			
			fs.writeFile(newFilename, data, function (err) {
				if (err) {
					throw err;
				}
				
				console.log("Minified " + newFilename);
				
				resolve();
			});
		});
	});
}

Promise.all([
	fixEnumerable('stage/common.js'),
	fixEnumerable('stage/connections.js'),
	fixEnumerable('stage/crt.js'),
	fixEnumerable('stage/crtcontrols.js'),
	fixEnumerable('stage/filetransfer.js'),
	fixEnumerable('stage/ftelnetclient.js'),
	fixEnumerable('stage/graph.js')
]).then(function() {
	Promise.all([
		combineFiles(['stage/common.js', 'stage/crt.js', 'stage/connections.js', 'stage/ftelnetclient.js'], 'release/ftelnet.norip.noxfer.js'),
		combineFiles(['include/blob.js', 'include/filesaver.js', 'stage/common.js', 'stage/crt.js', 'stage/connections.js', 'stage/crtcontrols.js', 'stage/filetransfer.js', 'stage/ftelnetclient.js'], 'release/ftelnet.norip.xfer.js'),
		combineFiles(['stage/common.js', 'stage/crt.js', 'stage/connections.js', 'stage/graph.js', 'stage/ftelnetclient.js'], 'release/ftelnet.rip.noxfer.js'),
		combineFiles(['include/blob.js', 'include/filesaver.js', 'stage/common.js', 'stage/crt.js', 'stage/connections.js', 'stage/crtcontrols.js', 'stage/filetransfer.js', 'stage/graph.js', 'stage/ftelnetclient.js'], 'release/ftelnet.rip.xfer.js')
	]).then(function() {
		Promise.all([
			minifyFile('release/ftelnet.norip.noxfer.js'),
			minifyFile('release/ftelnet.norip.xfer.js'),
			minifyFile('release/ftelnet.rip.noxfer.js'),
			minifyFile('release/ftelnet.rip.xfer.js')
		]);
	});
});

