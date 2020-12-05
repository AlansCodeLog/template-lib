const pkg = require("./package.json")
const fs = require("fs")
const path = require("path")

module.exports = {
	readme: "README.md",
	mode: "modules",
	inputFiles: ["src"],
	out: "docs",
	excludeNotExported: true,
	excludePrivate: true,
	excludeExternals: true,
	ignoreCompilerErrors: true,
	theme: "./node_modules/typedoc-neo-theme/bin/default",
	exclude: [
		// not excluding index files causes problems
		"**/*index.ts",
	],
	source: [{
		path: `${pkg.repository.url}/tree/master/`,
		line: "L",
	}],
	// prevents typedoc autodetecting installed plugins
	// explicity listing them makes things easier to debug
	plugin: [
		"typedoc-neo-theme",
		"typedoc-plugin-external-module-name",
		"typedoc-plugin-param-names",
	],
	// topbar
	links: [
		{"label": "Repository", "url": pkg.repository},
		{"label": "Issues", "url": pkg.repository + "/issues"}
	],
	// creates an outline using all the top level directories in the src folder
	outline: [
		fs.readdirSync("src")
			.filter(dir => fs.statSync(path.join("src", dir)).isDirectory())
			.reduce((obj, curr) => { obj[ curr ] = curr; return obj }, {})
	]
};
