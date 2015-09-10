/*
 * grunt-bust-requirejs-cache
 * https://github.com/dukai/grunt-bust-requirejs-cache
 *
 * Copyright (c) 2015 DK
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var util = require('util');
var crypto = require('crypto');

var ignoreMatch = function(src, patterns) {
	for (var i = 0, len = patterns.length; i < len; i++) {
		if (src.search(patterns[i]) != - 1) {
			return true;
		}
	}
	return false;
}

module.exports = function(grunt) {

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
	var baseUrl = (grunt.config.get('requirejs').compile.options.baseUrl.trim('/'));
	var appDir = (grunt.config.get('requirejs').compile.options.appDir.trim('/'));

	var srcUrl = appDir + "/" + baseUrl;

	grunt.log.writeln("src url: " + srcUrl);

	var resourceMap = {};

	grunt.registerMultiTask('bust_requirejs_cache', 'Bust Require.js module file cache.', function() {
		// Merge task-specific and/or target-specific options with these defaults.
		//grunt.log.writeln(util.inspect(this.files));

		var options = this.options();
		//grunt.log.writeln(util.inspect(options));

		// Iterate over all specified file groups.
		this.files.forEach(function(f) {
			// Concat specified files.
			var src = '';

			if (!grunt.file.exists(f.src[0])) {
				grunt.log.warn('Source file "' + f.src[0] + '" not found.');
			} else {
				src = grunt.file.read(f.src[0]);
			}

			//grunt.log.writeln(src);

			// Handle options.
			//src += options.punctuation;
			var regExp = /require\(\[(([\'\"][\w-\/]+[\'\"],*\s*)+)\]/ig;
			var requireMatches = src.match(regExp);
			//grunt.log.writeln(requireMatches);

			var hashedMatches = [];


			if (requireMatches) {
				hashedMatches = requireMatches.map(function(value) {
					var exp = /(['"])([\w-\/]+)(['"])/ig;
					var result = value.replace(exp, function($0, $1, moduleName, $3) {
						if (!/\.js$/.test(moduleName) && ! ignoreMatch(moduleName, options.ignorePatterns)) {
							var filepath = path.join(srcUrl, moduleName) + '.js';
							//grunt.log.writeln(filepath);
							var shasum = crypto.createHash('md5');
							var hash = shasum.update(grunt.file.read(filepath)).digest('hex');
							var moduleName = resourceMap[moduleName] = moduleName + '.' + hash;
							//grunt.log.writeln(hash);
						}

						return $1 + moduleName + $3;
					});
					//grunt.log.writeln(result);
					return result;
				});

				grunt.log.writeln(hashedMatches);
				requireMatches.forEach(function(value, index){
					if(value != hashedMatches[index]){
						src = src.replace(value, hashedMatches[index]);
					}
				});

			}


			// Write the destination file.
			grunt.file.write(f.dest, src);

			// Print a success message.
			grunt.log.writeln('File "' + f.dest + '" created.');
		});
		grunt.log.writeln(JSON.stringify(resourceMap));
		grunt.file.write('tmp/resource-map.json', JSON.stringify(resourceMap));
	});

};

