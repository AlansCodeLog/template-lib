import util from "util"
import { exec as _exec, spawnSync } from "child_process"
const exec = util.promisify(_exec)
import { promises as fs } from "fs"
import path from "path"

const template_path = path.resolve("package.template.json")

async function main() {
	let can_write = true
	let verbose = false
	let scoped = false
	let delete_template = true
	let args = process.argv.slice(2, process.argv.length)
	let known_options = [ "--dry", "-d", "--verbose", "-v", "--scoped", "-s", "--no-delete", "-n"]
	args.forEach(arg => {
		if (known_options.includes(arg)) {
			switch (arg) {
				case "-d":
				case "--dry": can_write = false; verbose = true; break
				case "-v":
				case "--verbose": verbose = true; break
				case "-s":
				case "--scoped": scoped = true; break
				case "-n":
				case "--no-delete": delete_template = false; break
			}
		} else {
			throw new Error(`Unknown options "${arg}". Known options: ${known_options} `)
		}
	})

	let npm_name = path.basename(process.cwd())
	let repo_name = npm_name
	if (npm_name.startsWith("my-")) npm_name = npm_name.slice(3, npm_name.length)
	if (scoped) npm_name = `@alanscodelog/${npm_name}`
	verbose && console.log(`name: ${npm_name}`)
	verbose && console.log(`repo-name: ${repo_name}`)

	let promises = []

	promises.push(async function package_json() {
		const template = await fs.readFile(template_path)
		/** @type {{[key:string]: { [key:string]: string }}} */
		const p = JSON.parse(template)
		/**
		 * We use both the required/parsed package json (to easily get the versions wanted and set them), and the unparsed file, so that we can keep the order and spacing in the file. So the parsed package json is only used as a guide to replace the values in the unparsed file.
		 */
		let p_raw = (template).toString()

		if (p.dependencies && Object.keys(p.dependencies).length !== 0){
			await set_json_dependencies(p.dependencies).then(() => {
				p_raw = set_raw_dependencies(p.dependencies, p_raw, "dependencies")
			})
		}
		if (p.devDependencies && Object.keys(p.devDependencies).length !== 0){
			await set_json_dependencies(p.devDependencies).then(() => {
				p_raw = set_raw_dependencies(p.devDependencies, p_raw, "devDependencies")
			})
		}
		if (p.peerDependencies && Object.keys(p.peerDependencies).length !== 0) {
			await set_json_dependencies(p.peerDependencies).then(() => {
				p_raw = set_raw_dependencies(p.peerDependencies, p_raw, "peerDependencies")
			})
		}
		p_raw = p_raw
			.replace(/TONAME/g, npm_name)
			.replace(/TOREPONAME/g, repo_name)

		can_write && await fs.writeFile("package.json", p_raw)
		return `================== package.json"\n${p_raw}`
	})

	promises.push(async function gitignore() {
		let gitignore = (await fs.readFile(path.resolve(".gitignore"))).toString()
		gitignore = gitignore.replace(/\n# template[\s\S]*/, "")
		can_write && await fs.writeFile(path.resolve(".gitignore"), gitignore)
		return `================== .gitignore"\n${gitignore}`
	})

	promises.push(async function readme() {
		let readme = (await fs.readFile(path.resolve("README.md"))).toString()
		readme = readme
			.replace(/<!--\n+([\s\S]*?)-->([\s\S]*)/gm, "$1")
			.replace(/TONAME/g, npm_name)
			.replace(/TOREPONAME/g, repo_name)
		can_write && await fs.writeFile(path.resolve("README.md"), readme)
		return `================== README.md"\n${readme}`
	})

	;[ "build", "pull-request", "docs", "release" ].forEach((action) => {
		promises.push(async function workflow() {
			let plain_path = `.github-rename-to-enable/workflows/${action}.yml`
			let file_path = path.resolve(plain_path)
			let workflow = (await fs.readFile(file_path)).toString()
			workflow = workflow
				.replace(/TONAME/g, npm_name)
				.replace(/TOREPONAME/g, repo_name)
			can_write && await fs.writeFile(file_path, workflow)
			return `================== ${plain_path}\n${workflow}`
		})
	})

	delete_template && can_write && promises.push(async () => {
		await fs.unlink(path.resolve("./package.template.json"))
		return `================== package.template.json"\n${"DELETED"}`
	})
	delete_template && can_write &&  promises.push(async () => {
		await fs.unlink(path.resolve("./install.mjs"))
		return `================== install.mjs"\n${"DELETED"}`
	})

	let res = await Promise.all(promises.map(promise => promise()))
	res.forEach(res => console.log(res))
	// since these don't take long and it's better to print them last they're not pushed to the promises array

	let dirs = [
		".github-rename-to-enable/workflows/build.yml",
		".github-rename-to-enable/workflows/docs.yml",
		".github-rename-to-enable/workflows/pull-request.yml",
		".github-rename-to-enable/workflows/release.yml",
		"jest.config.js",
		"package.json",
		"README.md"
	].join(" ")
	can_write && console.log(`================== TEMPLATE GENERATED
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
		console.log(name, tag, stderr)
		throw new Error()
	}

	let info = JSON.parse(stdout)
	let version = info["dist-tags"][tag]
	if (version === undefined) throw new Error(`Tag ${tag} for ${name} does not exist.`)
	console.log(name, tag, version)

	return version
}
