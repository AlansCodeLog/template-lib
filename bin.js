import fs from "fs/promises"
import {existsSync, readFileSync} from "fs"
import glob from "fast-glob"
import path from "path"

import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
import {crop, indent, colors, isBlank} from "@alanscodelog/utils"
import {run} from "@alanscodelog/utils/node"


const projectDir = process.cwd()
async function diffOrCopy(files, flags) {
	const promises = []
	const willOverwrite = []

	for (const file of files) {
		const relativeFile = typeof file === "object" ? file.file : file
		const relativeFileOut = typeof file === "object" ? file.out : file
		const filepath = path.resolve(__dirname, relativeFile)
		const outFilepath = path.resolve(relativeFileOut)
		if (flags.dry) {
			willOverwrite.push(typeof file === "object" ? file.out : file)
		}
		if (!flags.copy) {
			promises.push((async () => {
				const info = []
				info.push(`${colors.yellow}${relativeFile}${colors.reset}`)
					if (existsSync(outFilepath)) {
						// no pager so it writes to stdout
						const command = `git --no-pager diff --no-index --color ${outFilepath} ${filepath} | cat`
						const res = await run(command)
							.catch(e => {
								// error code 1 means there's a difference
								if (e.code !== 1) throw e
							})
						if (isBlank(res)) {
							info.push("No diff.")
						} else {
							info.push(res)
						}

					} else {
						info.push(`File does not exist, would add file: `)
						const fileContents = (await fs.readFile(filepath)).toString()
						info.push(`${colors.green}${fileContents}${colors.reset}`)
					}
				return info
			})())
		}
		if (flags.copy && !flags.dry) {
			promises.push((async () => {
				fs.copyFile(filepath, outFilepath)
				return []
			})())
		}
	}
	if (flags.dry) {
		console.log(crop`
			Will copy/overwrite the following files at:
				${projectDir}:
					${indent(willOverwrite.join("\n"), 5)}
		`)
	}
	const res = await Promise.all(promises)

	console.log(res.map(entries => entries.join("\n")).join("\n"))

}

function main(args) {
	const fastGlobOpts = {
		cwd: __dirname,
		ignore: ["**/node_modules/**"],
	}
	const flags = {
		"dry": args.includes("--dry") || args.includes("-d"),
		"test": args.includes("--test") || args.includes("-t"),
		"all": args.includes("--all") || args.includes("-a"),
		// "diff": args.includes("--diff") || args.includes("-d")
		"copy": args.includes("--copy") || args.includes("-c"),
		"help": args.includes("--help") || args.includes("-h")
	}
	const commands = {
		KEY: async () => { //as in only key parts
			await Promise.all(["gh", "husky", "ts", "eslint", "vite", "package"].map(type => commands[type]()))
		},
		gh: async () => {
			await diffOrCopy(await glob(".github/**/*", fastGlobOpts), flags)
		},
		gh_build: async () => {
			await diffOrCopy([".github/workflows/build.yml"], flags)
			await diffOrCopy([".github/workflows/build-only.yml"], flags)
		},
		gh_docs: async () => {
			await diffOrCopy([".github/workflows/docs.yml"], flags)
		},
		husky: async () => {
			await diffOrCopy(await glob(".husky/**/*", fastGlobOpts), flags)
		},
		tests: async () => {
			await diffOrCopy(await glob("tests/**/*", fastGlobOpts), flags)
		},
		ts: async () => {
			await diffOrCopy(await glob("tsconfig*", fastGlobOpts), flags)
		},
		eslint: async () => {
			await diffOrCopy(await glob([".eslintrc*", "**/.eslintrc*"], fastGlobOpts), flags)
		},
		vite: async () => {
			await diffOrCopy(await glob("vite*", fastGlobOpts), flags)
		},
		package: async () => {
			await diffOrCopy([{file:"package.template.json", out: "package.json"}], flags)
		},
		readme: async () => {
			await diffOrCopy(["README.md"], flags)
		},
		vscode: async () => {
			await diffOrCopy(await glob(".vscode/**/*", fastGlobOpts), flags)
		}
	}
	const commandsList = Object.keys(commands)
	if (args.includes("--list")) {
		console.log(commandsList)
		process.exit(0)
	}
	if (args.includes("--help")) {
		console.log(crop`
			Flags:
				${indent(Object.keys(flags).map(flag => `--${flag}, -${flag[0]}`).join("\n"), 4)}
			Commands:
				${indent(commandsList.join("\n"), 4)}
		`)

		process.exit(0)
	}
	if (flags.test || flags.all) {
		flags.dry = flags.test
		for (const command of commandsList) {
			commands[command]()
		}
	} else {
		for (const command of commandsList) {
			if (args.includes(command)) commands[command]()
		}
	}
}

main(process.argv.slice(2))
