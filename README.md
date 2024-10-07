
My template repo for typescript libraries. I have found myself setting up the same things over and over again so I decided to create a small template. It includes:

- typedoc for generating docs
- vite for builds with:
	- proper externalizing of deps for libraries
	- proper types output (with path aliases and baseUrl imports mapped to the correct paths)
- vitest for tests
- build/coverabe/docs/release github actions
- semantic release and commitlint for handling releases
- husky for handling git hooks
- [indexit](https://github.com/alanscodelog/indexit), my own tool, for generating/managing the exports of index files
- [`@alanscodelog/utils`](https://github.com/alanscodelog/utils) - my library of utility functions and types

I have also made repos for the configs that rarely change to help declutter things a bit:

- [`@alanscodelog/commitlint-config`](https://github.com/alanscodelog/commitlint-config)
- [`@alanscodelog/eslint-config`](https://github.com/alanscodelog/eslint-config)
- [`@alanscodelog/semantic-release-config`](https://github.com/alanscodelog/semantic-release-config)
- [`@alanscodelog/tsconfigs`](https://github.com/alanscodelog/tsconfigs)

# Notes

- The full github url is used in the package.json instead of the nice `github:user/repo` shorthand because then that information can easily accessed by typedoc.
- Madge can report false positives because of typescript `import type` imports. This can be fixed by adding a config file, but I'm not adding one for a single option. It's pretty obvious anyways when it's a type import, since I keep all types in a `types/*` folder in all my projects. Also doesn't work with vue files.
	- Needed because circular imports can bring a lot of problems, especially with esm. Convenience imports, like importing from a folder index are a no no if preserving modules when compiling.
- Scripts use `npm run` even though I use pnpm, so that it's maximally compatible in the case of testing issues, etc with other package managers.
- There's currently no bash scripts, but they should also be called via bash like `bash -c "..."` to avoid them not working in other shells.
- `@comments` property of package.json explains other non-obvious things.

# Install

This used to have a more complicated "install" script, but it was not easy to use and fragile.

I have created a new one that just diffs and optionally copies certain files. It's lost some features (like auto renaming of REPONAME variables), but is much easier to use.

This is not published, so I just link the package globally, then:
```sh
tempalte-lib [part-name] --flags

template-lib --help #will print out all the part names and flags
```

Workflow is usually:
```sh
template-lib KEY | more # review and copy small changes

template-lib [part-name] --copy # for larger changes that should always be in sync between libraries, like the github action workflows
```
# Todo

- [x] Convert to package.
- [ ] Publish package.
- [ ] Re-add renaming capibilities.
