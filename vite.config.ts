/* eslint-disable no-console */
/* eslint-disable import/no-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
// eslint-disable-next-line no-restricted-imports
import { run } from "@alanscodelog/utils/node"
import fs from "fs"
import { builtinModules } from "module"
import path, { resolve } from "path"
import { defineConfig, PluginOption } from "vite"


const ignoreDirs: string[] = ["internal"]
const getDirs = (): Record<string, string> => Object.fromEntries(fs.readdirSync(resolve(__dirname, "src"), { withFileTypes: true })
	.map(entry => {
		const isDir = entry.isDirectory()
		if (!ignoreDirs.includes(entry.name) && isDir) {
			const indexExists = fs.existsSync(resolve(__dirname, "src", entry.name, "index.ts"))
			if (indexExists) {
				console.log(`${entry.name} added to build dirs.`)
				return [`${entry.name}`, resolve(__dirname, "src", entry.name, "index.ts")]
			}
		}
		return undefined
	})
	.filter(entry => entry !== undefined) as string[][])

const typesPlugin = (): PluginOption => ({
	name: "typesPlugin",
	writeBundle: async () => run("npm run build:types").catch(e => console.log(e)).then(() => undefined),
})

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => defineConfig({
	plugins: [
		typesPlugin(),
	],
	build: {
		outDir: "dist",
		lib: {
			entry: {
				index: "src/index.ts",
				...getDirs(),
			},
			formats: ["es", "cjs"],
			fileName: (format, entryName) => {
				const suffix = format === "es" ? "js" : "cjs"
				return entryName.startsWith("index") ? `${entryName}.${suffix}` : `${entryName}/index.${suffix}`
			},
		},
		rollupOptions: {
			external: [...builtinModules],
		},
		...(mode === "production" ? {
			minify: false
		} : {
			minify: false,
			sourcemap: "inline",
		}),
	},
	resolve: {
		alias: [
			// absolute path needed because of https://github.com/vitest-dev/vitest/issues/2425
			{ find: /^@\/(.*)/, replacement: `${path.resolve("src")}/$1/index.ts` },
			{ find: /^@tests\/(.*)/, replacement: `${path.resolve("tests")}/$1` },
		],
	},
})
