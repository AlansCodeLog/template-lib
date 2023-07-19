import { escapeRegex } from "@alanscodelog/utils"
import glob from "fast-glob"
import { builtinModules } from "module"
import path from "path"
import dts from "vite-plugin-dts"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

import packageJson from "./package.json"



// https://vitejs.dev/config/
export default async ({ mode }: { mode: string }) => defineConfig({
	plugins: [
		// even if we don't use aliases, this is needed to get imports based on baseUrl working
		tsconfigPaths(),
		dts({
			entryRoot: "src",
			tsconfigPath: "tsconfig.types.json",
		}),
	],
	build: {
		outDir: "dist",
		lib: {
			entry: glob.sync(path.resolve(__dirname, "src/**/*.ts")),
			formats: ["es", "cjs"],
			fileName: (format, entryName) => {
				const suffix = format === "es" ? "js" : "cjs"
				return `${entryName}.${suffix}`
			},
		},
		rollupOptions: {
			external: [...builtinModules, ...Object.keys((packageJson as any).dependencies ?? {}), ...Object.keys((packageJson as any).peerDependencies ?? {}), /@babel\/runtime/],
			output: {
				preserveModulesRoot: "src",
				preserveModules: true,
			},
		},
		...(mode === "production" ? {
			minify: false,
		} : {
			minify: false,
			sourcemap: "inline",
		}),
	},
	test: {
		cache: process.env.CI ? false : undefined,
	},
	resolve: {
		alias: [
			// absolute path needed because of https://github.com/vitest-dev/vitest/issues/2425
			{ find: /^@\/(.*)/, replacement: `${path.resolve("src")}/$1/index.ts` },
			{ find: /^@tests\/(.*)/, replacement: `${path.resolve("tests")}/$1` },
		],
	},
	server: {
		watch: {
			// watch changes in linked repos
			ignored: ["!**/node_modules/@alanscodelog/**"],
		},
	},
})
