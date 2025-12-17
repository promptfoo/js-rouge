# js-rouge

A JavaScript implementation of the Recall-Oriented Understudy for Gisting Evaluation (ROUGE) evaluation metric for summaries. This package implements the following metrics:

- n-gram (ROUGE-N)
- Longest Common Subsequence (ROUGE-L)
- Skip Bigram (ROUGE-S)

> **Note**: This is a fork of [the original ROUGE.js](https://github.com/kenlimmj/rouge) by kenlimmj. This fork adds TypeScript types and other improvements.

## Rationale

ROUGE is somewhat a standard metric for evaluating the performance of auto-summarization algorithms. However, with the exception of [MEAD](http://www.summarization.com/mead/) (which is written in Perl. Yes. Perl.), requesting a copy of ROUGE to work with requires one to navigate a barely functional [webpage](http://www.isi.edu/licensed-sw/see/rouge/), fill up [forms](http://www.berouge.com/Pages/DownloadROUGE.aspx), and sign a legal release somewhere along the way while at it. These definitely exist for good reason, but it gets irritating when all one wishes to do is benchmark an algorithm.

Nevertheless, the [paper](http://www.aclweb.org/anthology/W04-1013) describing ROUGE is available for public consumption. The appropriate course of action is then to convert the equations in the paper to a more user-friendly format, which takes the form of the present repository. So there. No more forms. See how life could have been made a lot easier for everyone if we were all willing to stop writing legalese or making people click submit buttons?

## Quick Start

This package is available on NPM:

```shell
npm install js-rouge
```

To use it:

```javascript
import { n, l, s } from 'js-rouge'; // ES Modules

// OR

const { n, l, s } = require('js-rouge'); // CommonJS
```

To run tests:

```shell
npm test
```

## Usage

js-rouge provides three main functions:

- **ROUGE-N**: `n(candidate, reference, opts)`
- **ROUGE-L**: `l(candidate, reference, opts)`
- **ROUGE-S**: `s(candidate, reference, opts)`

All functions take a candidate string, a reference string, and an optional configuration object.

### ROUGE-L Example

```javascript
import { l as rougeL } from 'js-rouge';

const reference = 'police killed the gunman';
const candidate = 'police kill the gunman';

const score = rougeL(candidate, reference, { beta: 0.5 });

console.log('score:', score); // => 0.75
```

### Jackknife Resampling

The package also exports utility functions, including jackknife resampling as described in the original paper:

```javascript
import { n as rougeN, jackKnife } from 'js-rouge';

const reference = 'police killed the gunman';
const candidates = [
  'police kill the gunman',
  'the gunman kill police',
  'the gunman police killed',
];

// Standard evaluation taking the arithmetic mean
jackKnife(candidates, reference, rougeN);

// A function that returns the max value in an array
const distMax = (arr) => Math.max(...arr);

// Modified evaluation taking the distribution maximum
jackKnife(candidates, reference, rougeN, distMax);
```

## TypeScript

This package is written in TypeScript and includes type definitions. All functions and utilities are fully typed.

## Versioning

Development will be maintained under the Semantic Versioning guidelines as much as possible in order to ensure transparency and backwards compatibility.

Releases will be numbered with the following format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

- Breaking backward compatibility bumps the major (and resets the minor and patch)
- New additions without breaking backward compatibility bump the minor (and resets the patch)
- Bug fixes and miscellaneous changes bump the patch

For more information on SemVer, visit http://semver.org/.

## Bug Tracking and Feature Requests

Have a bug or a feature request? [Please open a new issue](https://github.com/promptfoo/js-rouge/issues).

## Contributing

Please submit all pull requests against the main branch. All code should pass ESLint validation and tests.

The amount of data available for writing tests is unfortunately woefully inadequate. We've tried to be as thorough as possible, but that eliminates neither the possibility of nor existence of errors. The gold standard is the DUC data-set, but that too is form-walled and legal-release-walled, which is infuriating. If you have data in the form of a candidate summary, reference(s), and a verified ROUGE score you do not mind sharing, we would love to add that to the test harness.

## License

MIT
