/** @type {import('@typescript-eslint/utils').TSESLint.Linter.Config} */
module.exports = {
	root: true,
	extends: [
		// https://github.com/AlansCodeLog/my-eslint-config
		"@alanscodelog/eslint-config",
	],
	// for vscode, so it doesn't try to lint files in here when we open them
	ignorePatterns: [
		"coverage",
		"dist",
		"docs",
	],
	rules: {
	},
	overrides: [
		// Eslint: https://eslint.org/docs/rules/
		{
			files: ["**/*.js", "**/*.ts"],
			rules: {
			},
		},
		// Typescript: https://github.com/typescript-eslint/typescript-eslint/master/packages/eslint-plugin#supported-rules
		{
			files: ["**/*.ts"],
			rules: {
			},
		},
	],
}
