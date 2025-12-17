# Changelog

## [3.1.5](https://github.com/promptfoo/js-rouge/compare/js-rouge-v3.1.4...js-rouge-v3.1.5) (2025-12-17)


### Bug Fixes

* update repository URLs to match actual repo name ([#44](https://github.com/promptfoo/js-rouge/issues/44)) ([80d6210](https://github.com/promptfoo/js-rouge/commit/80d621059f53db48cc5d3c3dc256abda4a18820d))

## [3.1.4](https://github.com/promptfoo/js-rouge/compare/js-rouge-v3.1.3...js-rouge-v3.1.4) (2025-12-17)


### Bug Fixes

* use Node 24 for npm OIDC trusted publishing ([#40](https://github.com/promptfoo/js-rouge/issues/40)) ([399398e](https://github.com/promptfoo/js-rouge/commit/399398e3c13e24bc3d19a7b76d027d37afa93109))

## [3.1.3](https://github.com/promptfoo/js-rouge/compare/js-rouge-v3.1.2...js-rouge-v3.1.3) (2025-12-17)


### Bug Fixes

* add registry-url for npm OIDC authentication ([#38](https://github.com/promptfoo/js-rouge/issues/38)) ([20f0068](https://github.com/promptfoo/js-rouge/commit/20f0068b32edd075f48faab80d0a637dd563dd55))

## [3.1.2](https://github.com/promptfoo/js-rouge/compare/js-rouge-v3.1.1...js-rouge-v3.1.2) (2025-12-17)


### Bug Fixes

* remove registry-url to enable npm OIDC authentication ([#36](https://github.com/promptfoo/js-rouge/issues/36)) ([33b4d38](https://github.com/promptfoo/js-rouge/commit/33b4d38c1c2bb20fb7322c09cfca67b8f6ab31a1))

## [3.1.1](https://github.com/promptfoo/js-rouge/compare/js-rouge-v3.1.0...js-rouge-v3.1.1) (2025-12-17)


### Bug Fixes

* add NODE_AUTH_TOKEN to npm publish step ([9a1bb06](https://github.com/promptfoo/js-rouge/commit/9a1bb06613f027b52f68cbdf0e216eeb2fdbc2c2))
* use npm OIDC for publish authentication ([#35](https://github.com/promptfoo/js-rouge/issues/35)) ([82dd724](https://github.com/promptfoo/js-rouge/commit/82dd724eebefb81d90ebd58a945121fb533fe76d))

## [3.1.0](https://github.com/promptfoo/js-rouge/compare/js-rouge-v3.0.0...js-rouge-v3.1.0) (2025-12-17)


### Features

* add caseSensitive option to all ROUGE functions ([#33](https://github.com/promptfoo/js-rouge/issues/33)) ([996ffbd](https://github.com/promptfoo/js-rouge/commit/996ffbd31b6b30985c64f6a0e1b9671acf41ee82))
* add maxSkip parameter to ROUGE-S ([#20](https://github.com/promptfoo/js-rouge/issues/20)) ([05d1f3a](https://github.com/promptfoo/js-rouge/commit/05d1f3a39d9ebd2869790573defa44895e245dc2))
* add skip window (maxSkip) support to ROUGE-S ([05d1f3a](https://github.com/promptfoo/js-rouge/commit/05d1f3a39d9ebd2869790573defa44895e245dc2))
* change default beta to 1.0 for balanced F1 ([#19](https://github.com/promptfoo/js-rouge/issues/19)) ([ccc6615](https://github.com/promptfoo/js-rouge/commit/ccc66159cd50477210fd3c11a6fabab8d73cb1ee))
* make ROUGE-N return F-score instead of recall ([#18](https://github.com/promptfoo/js-rouge/issues/18)) ([034f52c](https://github.com/promptfoo/js-rouge/commit/034f52cd88e2a5934b8406b72bd238183c177cec))
* make ROUGE-N return F-score instead of recall-only ([034f52c](https://github.com/promptfoo/js-rouge/commit/034f52cd88e2a5934b8406b72bd238183c177cec))
* rename package to js-rouge and add npm publish workflow ([0b9394b](https://github.com/promptfoo/js-rouge/commit/0b9394b6ef6fafd6d44f84a8b33998db3bd06c2d))
* update project structure and modernize tooling ([#1](https://github.com/promptfoo/js-rouge/issues/1)) ([7631ebf](https://github.com/promptfoo/js-rouge/commit/7631ebfc4c0bf01d1e6acc9813e14f67ae8a7273))


### Bug Fixes

* add exports field to package.json ([#22](https://github.com/promptfoo/js-rouge/issues/22)) ([5f7f3f8](https://github.com/promptfoo/js-rouge/commit/5f7f3f84cf2b127a01d83566dd7f2180bd38d19a))
* add files field and fix directories in package.json ([#23](https://github.com/promptfoo/js-rouge/issues/23)) ([b18ff71](https://github.com/promptfoo/js-rouge/commit/b18ff716dae0e54a3b18dc0dc6406ec9a0e7621b))
* align default beta values with documentation ([ccc6615](https://github.com/promptfoo/js-rouge/commit/ccc66159cd50477210fd3c11a6fabab8d73cb1ee))
* correct ROUGE-L union LCS calculation ([#17](https://github.com/promptfoo/js-rouge/issues/17)) ([29a77b6](https://github.com/promptfoo/js-rouge/commit/29a77b62891288514be37d8c4e50bb453f8a4e39))
* enable ESLint to lint test files ([#25](https://github.com/promptfoo/js-rouge/issues/25)) ([943d185](https://github.com/promptfoo/js-rouge/commit/943d185884028869d69e1ad9a98a94b313afe4b5))
* make charIsUpperCase i18n-compatible ([#31](https://github.com/promptfoo/js-rouge/issues/31)) ([eca0020](https://github.com/promptfoo/js-rouge/commit/eca0020f0be8e25a442fd2e3e926808af1922316))
* move workflow ([4f33c5a](https://github.com/promptfoo/js-rouge/commit/4f33c5a5d01f474e5a32e4adb8ade9571dac229f))
