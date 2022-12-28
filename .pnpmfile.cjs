const fs = require("fs")

function readPackage(pkg, context) {
	if (fs.existsSync("./node_modules/pnpmfile-utils")) {
		const {removeGloballyLinked} = require("pnpmfile-utils")

		const selfPkg = require("./package.json")
		/** My own packages will always have the following as their version numbers. */
		const symLinkedVersions = ["0.0.0", "0.0.0-semantically-released"]
		const symLinkedNames = []
		removeGloballyLinked(pkg, selfPkg, symLinkedNames, symLinkedVersions)
	}

	return pkg
}

module.exports = {
	hooks: {
		readPackage
	}
}
