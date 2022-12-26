<!--
TOCONFIGURE

![Docs](https://github.com/alanscodelog/TOREPONAME/workflows/Docs/badge.svg)
![Build](https://github.com/alanscodelog/TOREPONAME/workflows/Build/badge.svg)
[![Release](https://github.com/alanscodelog/TOREPONAME/workflows/Release/badge.svg)](https://www.npmjs.com/package/TONAME)

# [Docs](https://alanscodelog.github.io/TOREPONAME)

# Install

```bash
npm install TONAME
# or
yarn add TONAME
```


# Usage

```ts
```

-->

My template repo for typescript libraries. I have found myself setting up the same things over and over again so I decided to create a small template. It includes:

- typedoc for generating docs
- vitest and chai (I prefer the syntax) for tests
- build/coverabe/docs/release github actions
- semantic release and commitlint for handling releases
- husky for handling git hooks
- [indexit](https://github.com/alanscodelog/indexit), my own tool, for generating/managing the exports of index files
- [`@alanscodelog/utils`](https://github.com/alanscodelog/my-utils) - my library of utility functions and types

I have also made repos for the configs that rarely change to help declutter things a bit:

- [`@alanscodelog/commitlint-config`](https://github.com/alanscodelog/commitlint-config)
- [`@alanscodelog/eslint-config`](https://github.com/alanscodelog/eslint-config)
- [`@alanscodelog/semantic-release-config`](https://github.com/alanscodelog/my-semantic-release-config)
- [`@alanscodelog/tsconfigs`](https://github.com/alanscodelog/my-tsconfigs)

# Notes

- The full github url is used in the package.json instead of the nice `github:user/repo` shorthand because then that information can easily accessed by typedoc.


# Todo

- Convert to package.
