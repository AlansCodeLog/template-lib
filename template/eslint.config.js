import { allFileTypes, tsEslintConfig, vueConfig } from "@alanscodelog/eslint-config"
export default tsEslintConfig( // this is just a re-export of tsEslint.config
	// https://github.com/AlansCodeLog/eslint-config
	...vueConfig,
	{
		ignores: [
			// ...
		],

		languageOptions: {
			parserOptions: {
				projectService: {
					// allowDefaultProject: [...allowDefaultProjectGlobs, "*.vue"]
					// defaultProject: "./tsconfig.eslint.json",
				},
			},
		},
	},
	{
		// files: [`**/*.{${allFileTypes.join(",")}}`],
	}
	// RULE LINKS
	// Eslint: https://eslint.org/docs/rules/
	// Typescript: https://typescript-eslint.io/rules/
	// Vue: https://eslint.vuejs.org/rules/
)
