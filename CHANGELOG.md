# Changelog

## [3.1.5](https://github.com/promptfoo/js-rouge/compare/js-rouge-v3.1.0...js-rouge-v3.1.5) (2025-12-17)

### Bug Fixes

- update repository URLs to match actual repo name ([#44](https://github.com/promptfoo/js-rouge/issues/44)) ([80d6210](https://github.com/promptfoo/js-rouge/commit/80d621059f53db48cc5d3c3dc256abda4a18820d))

### Internal

- 3.1.1–3.1.4 were internal releases fixing npm OIDC publishing and were not published to npm

## [3.1.0](https://github.com/promptfoo/js-rouge/compare/3.0.0...js-rouge-v3.1.0) (2025-12-17)

### ⚠ BREAKING CHANGES

- ROUGE-N now returns F-score instead of recall-only. If you were relying on recall-only behavior, you'll need to adjust your code.
- Default `beta` changed from `Infinity` to `1.0` for balanced F1 score. Pass `beta: Infinity` explicitly to restore recall-only behavior.

### Features

- add `caseSensitive` option to all ROUGE functions ([#33](https://github.com/promptfoo/js-rouge/issues/33)) ([996ffbd](https://github.com/promptfoo/js-rouge/commit/996ffbd31b6b30985c64f6a0e1b9671acf41ee82))
- add `maxSkip` parameter to ROUGE-S for controlling skip distance ([#20](https://github.com/promptfoo/js-rouge/issues/20)) ([05d1f3a](https://github.com/promptfoo/js-rouge/commit/05d1f3a39d9ebd2869790573defa44895e245dc2))
- change default beta to 1.0 for balanced F1 ([#19](https://github.com/promptfoo/js-rouge/issues/19)) ([ccc6615](https://github.com/promptfoo/js-rouge/commit/ccc66159cd50477210fd3c11a6fabab8d73cb1ee))
- make ROUGE-N return F-score instead of recall ([#18](https://github.com/promptfoo/js-rouge/issues/18)) ([034f52c](https://github.com/promptfoo/js-rouge/commit/034f52cd88e2a5934b8406b72bd238183c177cec))

### Bug Fixes

- add `exports` field to package.json for ESM/CJS support ([#22](https://github.com/promptfoo/js-rouge/issues/22)) ([5f7f3f8](https://github.com/promptfoo/js-rouge/commit/5f7f3f84cf2b127a01d83566dd7f2180bd38d19a))
- add `files` field and fix directories in package.json ([#23](https://github.com/promptfoo/js-rouge/issues/23)) ([b18ff71](https://github.com/promptfoo/js-rouge/commit/b18ff716dae0e54a3b18dc0dc6406ec9a0e7621b))
- correct ROUGE-L union LCS calculation ([#17](https://github.com/promptfoo/js-rouge/issues/17)) ([29a77b6](https://github.com/promptfoo/js-rouge/commit/29a77b62891288514be37d8c4e50bb453f8a4e39))
- enable ESLint to lint test files ([#25](https://github.com/promptfoo/js-rouge/issues/25)) ([943d185](https://github.com/promptfoo/js-rouge/commit/943d185884028869d69e1ad9a98a94b313afe4b5))
- make `charIsUpperCase` i18n-compatible ([#31](https://github.com/promptfoo/js-rouge/issues/31)) ([eca0020](https://github.com/promptfoo/js-rouge/commit/eca0020f0be8e25a442fd2e3e926808af1922316))

## [3.0.0](https://github.com/promptfoo/js-rouge/releases/tag/3.0.0) (2024-08-19)

This release represents a major modernization of the original [`rouge`](https://www.npmjs.com/package/rouge) package by [Kenneth Lim](https://github.com/kenlimmj). The package has been forked and is now maintained by [promptfoo](https://github.com/promptfoo).

### ⚠ BREAKING CHANGES

- Package renamed from `rouge` to `js-rouge`
- Rewritten in TypeScript with strict mode
- Minimum Node.js version: 18.0.0
- Build output changed from Babel to esbuild

### Features

- Full TypeScript support with bundled type definitions
- ESM module support alongside CommonJS
- Dual CJS/ESM package exports
- Automated CI/CD with GitHub Actions
- 100% test coverage

### Migration from 2.x

```javascript
// Before (rouge 2.x)
const rouge = require("rouge");
rouge.n(candidate, reference);

// After (js-rouge 3.x)
const { n, l, s } = require("js-rouge");
// or
import { n, l, s } from "js-rouge";
n(candidate, reference);
```

## 2.x and Earlier

Versions 2.0.0, 2.0.1, and earlier were published by the original author [Kenneth Lim](https://github.com/kenlimmj) under the package name `rouge`. See the [original repository](https://github.com/kenlimmj/rouge) for historical changelog.

Key milestones in the original package:

- **2.0.0** – ES6 rewrite with Babel transpilation
- **1.x** – Initial implementation
