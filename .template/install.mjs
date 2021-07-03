#!/usr/bin/env node
import {exec as _exec} from "child_process"
import {promises as fs} from "fs"
import path from "path"
import {fileURLToPath} from 'url'
import util from "util"
const exec = util.promisify(_exec)


async function main() {
	let template_path = path.resolve("package.template.json")
	let can_write = true
	let verbose = false
	let scoped = false
	let delete_template = true
	let only_update = false
	let just_help = false
	let just_version = false
	let args = process.argv.slice(2, process.argv.length)
	let known_options = [
		"-d",
		"--dry",
		"-v",
		"--verbose",
		"-s",
		"--scoped",
		"-n",
		"--no-delete",
		"-u",
		"--only-update",
		"-v",
		"--version",
		"-h",
		"--help"
	]
	args.forEach(arg => {
		if (known_options.includes(arg)) {
			switch (arg) {
				case "-h":
				case "--help": just_help = true; break
				case "-v":
				case "--version": just_version = true; break
				case "-d":
				case "--dry": can_write = false; verbose = true; break
				case "-v":
				case "--verbose": verbose = true; break
				case "-s":
				case "--scoped": scoped = true; break
				case "-n":
				case "--no-delete": delete_template = false; break
				case "-u":
				case "--only-update": {
					only_update = true
					template_path = path.resolve("package.json")
				}; break
			}
		} else {
			throw new Error(`Unknown options "${arg}". Known options: ${known_options} `)
		}
	})
	if (just_help) {
		let pairs = []
		let pair = []
		for (let i = 0; i < known_options.length; i++) {
			pair.push(known_options[i])
			if (i % 2) {
				pairs.push(pair)
				pair = []
			}
		}
		for (pair of pairs) {
			console.log(pair[0] + ", " + pair[1])
		}
		process.exit(0)
	}
	let packagePath = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

	let template_commit_sha = (await exec("git rev-parse --short --verify HEAD", { cwd: packagePath } ).catch(err => {
		console.log(err)
		return "TOCONFIGURE - ERROR: Could not find template commit."
	})).stdout.trim()

	if (just_version) {
		console.log(`Version (template commit SHA): ${template_commit_sha}`)
		process.exit(0)
	}

	let npm_name = path.basename(process.cwd())
	let repo_name = npm_name
	if (npm_name.startsWith("my-")) npm_name = npm_name.slice(3, npm_name.length)
	if (scoped) npm_name = `@alanscodelog/${npm_name}`
	!only_update && verbose && console.log(`name: ${npm_name}`)
	!only_update && verbose && console.log(`repo name: ${repo_name}`)
	!only_update && verbose && console.log(`template commit SHA: ${template_commit_sha}`)

	let promises = []

	promises.push(async function package_json() {
		const template = await fs.readFile(template_path)
		/** @type {{[key:string]: { [key:string]: string }}} */
		const p = JSON.parse(template)
		/**
		 * We use both the required/parsed package json (to easily get the versions wanted and set them), and the unparsed file, so that we can keep the order and spacing in the file. So the parsed package json is only used as a guide to replace the values in the unparsed file.
		 */
		let p_raw = (template).toString()

		// if (p.dependencies && Object.keys(p.dependencies).length !== 0){
		// 	await set_json_dependencies(p.dependencies).then(() => {
		// 		p_raw = set_raw_dependencies(p.dependencies, p_raw, "dependencies")
		// 	})
		// }
		// if (p.devDependencies && Object.keys(p.devDependencies).length !== 0){
		// 	await set_json_dependencies(p.devDependencies).then(() => {
		// 		p_raw = set_raw_dependencies(p.devDependencies, p_raw, "devDependencies")
		// 	})
		// }
		// if (p.peerDependencies && Object.keys(p.peerDependencies).length !== 0) {
		// 	await set_json_dependencies(p.peerDependencies).then(() => {
		// 		p_raw = set_raw_dependencies(p.peerDependencies, p_raw, "peerDependencies")
		// 	})
		// }
		if (!only_update) {
			p_raw = p_raw
				.replace(/TONAME/g, npm_name)
				.replace(/TOREPONAME/g, repo_name)
				.replace(/TEMPLATE\:COMMIT/g, `TEMPLATE:${template_commit_sha}`)
		}
		console.log(p_raw)


		can_write && await fs.writeFile("package.json", p_raw)
		return `================== package.json"\n${p_raw}`
	})

	!only_update && promises.push(async function gitignore() {
		let gitignore = (await fs.readFile(path.resolve(".gitignore"))).toString()
		gitignore = gitignore.replace(/\n# template[\s\S]*/, "")
		can_write && await fs.writeFile(path.resolve(".gitignore"), gitignore)
		return `================== .gitignore"\n${gitignore}`
	})

	!only_update && promises.push(async function readme() {
		let readme = (await fs.readFile(path.resolve("README.md"))).toString()
		readme = readme
			.replace(/<!--\n+([\s\S]*?)-->([\s\S]*)/gm, "$1")
			.replace(/TONAME/g, npm_name)
			.replace(/TOREPONAME/g, repo_name)
		can_write && await fs.writeFile(path.resolve("README.md"), readme)
		return `================== README.md"\n${readme}`
	})

	!only_update && [ "build", "pull-request", "docs", "release" ].forEach((action) => {
		promises.push(async function workflow() {
			let plain_path = `.github/workflows/${action}.yml`
			let file_path = path.resolve(plain_path)
			let workflow = (await fs.readFile(file_path)).toString()
			workflow = workflow
				.replace(/TONAME/g, npm_name)
				.replace(/TOREPONAME/g, repo_name)
			can_write && await fs.writeFile(file_path, workflow)
			return `================== ${plain_path}\n${workflow}`
		})
	})

	!only_update && delete_template && can_write && promises.push(async () => {
		await fs.unlink(path.resolve("./package.template.json"))
		return `================== package.template.json"\n${"DELETED"}`
	})
	delete_template && can_write && promises.push(async () => {
		let exists = await fs.readFile(path.resolve("./.template")).then(() => true).catch(() => false)
		if (exists) {
			return fs.rmdir(path.resolve("./.template"), { recursive: true })
				.then(() => `================== .template/install.mjs"\n${"DELETED"}`)
		} else {
			return ""
		}
	})


	let res = await Promise.all(promises.map(promise => promise()))
	res.forEach(res => console.log(res))
	// since these don't take long and it's better to print them last they're not pushed to the promises array

	let dirs = [
		".github/workflows/build.yml",
		".github/workflows/docs.yml",
		".github/workflows/pull-request.yml",
		".github/workflows/release.yml",
		"jest.config.js",
		"package.json",
		"README.md"
	].join(" ")
	!only_update && can_write && console.log(`================== TEMPLATE GENERATED
	Run:
		yarn install \\
		&& ./node_modules/@alanscodelog/eslint-config/install.sh \\
		&& ./node_modules/@alanscodelog/tsconfigs/install.sh \\
		&& grep "TOCONFIGURE" ${dirs} -H -n -A1 --color`.replace(/\t+/g, ""))
}
main().catch(e => {
	console.error(e);
});

async function set_json_dependencies(deps) {
	return Promise.all(Object.keys(deps).map(async dep => {
		let version_wanted = deps[ dep ];
		if (version_wanted.match(/^[^0-9]{0,2}([0-9]+)\.([0-9]+)\.([0-9]+).*$/)) {
			deps[ dep ] = version_wanted;
		} else {
			let current = await get_tag_version(dep, version_wanted)
			deps[ dep ] = `^${current}`;
		}
	}))
}
function set_raw_dependencies(deps, p_raw, type) {
	let regex = new RegExp(`"${type}":\\s*?\\{([\\s\\S]*?)\\}`)
	let regex_replace = new RegExp(`("${type}":\\s*?\\{)([\\s\\S]*?)(\\})`)

	let raw_deps = p_raw.match(regex)?.[ 1 ]
	Object.entries(deps).forEach(([ name, version ]) => {
		let regex = new RegExp(`\"${name}\"\\s*\:\\s*".*?"`)
		raw_deps = raw_deps.replace(regex, `"${name}": "${version}"`)
	})
	p_raw = p_raw.replace(regex_replace, (match, before, content, after) => {
		return before + raw_deps + after
	})
	return p_raw
}

async function get_tag_version(name, tag) {

	let { stdout, stderr } = await exec(`npm view ${name} --json`);
	if (stderr) {
		throw new Error(`Error fetching ${tag} version for ${name}:\n${stderr}`)
	}

	let info = JSON.parse(stdout)
	let version = info["dist-tags"][tag]
	if (version === undefined) throw new Error(`Tag ${tag} for ${name} does not exist.`)

	return version
}
