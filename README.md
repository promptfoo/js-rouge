# js-rouge

[![npm version](https://img.shields.io/npm/v/js-rouge.svg)](https://www.npmjs.com/package/js-rouge)
[![CI](https://github.com/promptfoo/js-rouge/actions/workflows/ci.yml/badge.svg)](https://github.com/promptfoo/js-rouge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A JavaScript implementation of the Recall-Oriented Understudy for Gisting Evaluation (ROUGE) evaluation metric for summaries. This package implements the following metrics:

- n-gram (ROUGE-N)
- Longest Common Subsequence (ROUGE-L)
- Skip Bigram (ROUGE-S)

> **Note**: This is a fork of [the original ROUGE.js](https://github.com/kenlimmj/rouge) by kenlimmj. This fork adds TypeScript types, security fixes, and other improvements.

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
import { n, l, s } from "js-rouge"; // ES Modules

// OR

const { n, l, s } = require("js-rouge"); // CommonJS
```

## Usage

js-rouge provides three main functions:

- **ROUGE-N**: `n(candidate, reference, opts)` - N-gram overlap
- **ROUGE-L**: `l(candidate, reference, opts)` - Longest Common Subsequence
- **ROUGE-S**: `s(candidate, reference, opts)` - Skip-bigram co-occurrence

All functions return an F-score between 0 and 1.

### ROUGE-N Example

```javascript
import { n as rougeN } from "js-rouge";

const candidate = "the cat sat on the mat";
const reference = "the cat sat on the mat";

// ROUGE-1 (unigram)
rougeN(candidate, reference, { n: 1 }); // => 1.0

// ROUGE-2 (bigram)
rougeN(candidate, reference, { n: 2 }); // => 1.0

// With partial match
rougeN("the cat sat", "the cat sat on the mat", { n: 1 }); // => 2/3
```

### ROUGE-L Example

```javascript
import { l as rougeL } from "js-rouge";

const reference = "police killed the gunman";
const candidate = "police kill the gunman";

rougeL(candidate, reference); // => 0.75
```

`l()` computes summary-level union LCS (called `rougeLsum` in Google's ROUGE package). It unions matched reference-token positions across candidate sentences and clips credit to the candidate's token counts. Sentence tokenization supplies both the matches and their denominators. Case-insensitive comparison preserves sentence boundaries by applying case folding after segmentation.

The exported `lcs(a, b)` utility still returns token values. A custom `lcs` callback must return an ordered token subsequence; its values are aligned to successive reference occurrences from left to right. The built-in implementation retains the exact reference positions from its LCS alignment.

These corrections change ROUGE-L scores for repeated words and multi-sentence summaries. Rerun evaluation baselines when comparing versions.

### ROUGE-S Example

```javascript
import { s as rougeS } from "js-rouge";

const reference = "police killed the gunman";
const candidate = "police kill the gunman";

// Default: considers all word pairs
rougeS(candidate, reference); // => 0.5

// With skip distance limit
rougeS(candidate, reference, { maxSkip: 2 }); // considers only nearby word pairs
```

### Case Sensitivity

All functions are case-sensitive by default. Use `caseSensitive: false` for case-insensitive comparison:

```javascript
import { n as rougeN } from "js-rouge";

rougeN("Hello World", "hello world"); // => 0 (no match)
rougeN("Hello World", "hello world", { caseSensitive: false }); // => 1.0
```

### Text Preprocessing

The default Penn Treebank tokenizer expects one sentence at a time. All three metrics segment the original text before applying case folding and tokenizing each sentence. ROUGE-N and ROUGE-S flatten those tokens into one summary-level stream, so grams may still cross sentence boundaries. Explicitly passing the exported `treeBankTokenize` uses the same default path. Other custom `tokenizer` functions supplied to `n()` or `s()` continue to receive each whole summary once; `l()` calls them per sentence.

The tokenizer treats spaces, tabs, line breaks, and other whitespace as word separators. It returns no tokens for whitespace-only text and expands every occurrence of supported contractions. Punctuation remains part of the token stream. Colons and commas are separated unless followed by a digit, preserving numbers such as `12,000` and times such as `12:30`.

The default sentence segmenter handles LF, CRLF, and CR line endings and ignores blank separator chunks. Abbreviations such as `e.g.` are matched literally, and sentences ending in an initial or acronym are retained even when the following fragment has no punctuation. Spaces following a mid-sentence ellipsis are retained instead of joining adjacent words. Closing double quotes stay with their preceding sentence. Geographic acronyms such as `U.S.` remain attached to following names unless a recognized sentence starter indicates a boundary.

The scoring functions reject empty or whitespace-only candidate/reference summaries with `RangeError`. Existing minimum-token requirements still apply: ROUGE-N needs at least `n` tokens, and ROUGE-S needs at least two. The standalone `sentenceSegment` utility retains its single-sentence fallback for whitespace-only input.

These preprocessing corrections can change scores for multi-sentence summaries, colons, numeric commas, and ellipses. For example, `n("Alpha. Beta.", "Beta. Alpha.")` now returns `1` rather than `1/3`. Rerun affected baselines and keep the same tokenizer and segmenter configuration when comparing evaluation runs across versions.

## Options

Omitted options and fields explicitly set to `undefined` use the documented defaults. Explicit `false`, `0`, and `Infinity` values are preserved where supported.

`n` must be a positive integer. `maxSkip` must be a non-negative integer or positive `Infinity`. `beta` must be a non-negative finite number or positive `Infinity`; `NaN` is never valid. Invalid numeric options throw `RangeError` before tokenization or a zero-overlap return, including with custom gram generators. The public `nGram`, `skipBigram`, and `fMeasure` utilities enforce the same numeric contracts, and `fMeasure` requires finite precision and recall in `[0, 1]`. Large finite beta values are evaluated without squaring them into overflow.

### ROUGE-N Options

| Option          | Type     | Default       | Description                                            |
| --------------- | -------- | ------------- | ------------------------------------------------------ |
| `n`             | number   | `1`           | N-gram size (1 = unigram, 2 = bigram, etc.)            |
| `beta`          | number   | `1.0`         | F-measure weight (1.0 = F1, balanced precision/recall) |
| `caseSensitive` | boolean  | `true`        | Whether comparison is case-sensitive                   |
| `tokenizer`     | function | Penn Treebank | Custom tokenizer function                              |
| `nGram`         | function | built-in      | Custom n-gram generator                                |

### ROUGE-L Options

| Option          | Type     | Default       | Description                          |
| --------------- | -------- | ------------- | ------------------------------------ |
| `beta`          | number   | `1.0`         | F-measure weight                     |
| `caseSensitive` | boolean  | `true`        | Whether comparison is case-sensitive |
| `tokenizer`     | function | Penn Treebank | Custom tokenizer function            |
| `segmenter`     | function | built-in      | Custom sentence segmenter            |
| `lcs`           | function | built-in      | Custom LCS function                  |

### ROUGE-S Options

| Option          | Type     | Default       | Description                          |
| --------------- | -------- | ------------- | ------------------------------------ |
| `beta`          | number   | `1.0`         | F-measure weight                     |
| `caseSensitive` | boolean  | `true`        | Whether comparison is case-sensitive |
| `maxSkip`       | number   | `Infinity`    | Maximum token index distance         |
| `tokenizer`     | function | Penn Treebank | Custom tokenizer function            |
| `skipBigram`    | function | built-in      | Custom skip-bigram generator         |

`maxSkip` measures the distance between token indices: `1` includes adjacent pairs, and `2` allows one intervening token. A value of `0` produces no pairs. To match a maximum gap of `d` intervening words in the ROUGE paper or Perl implementation, use `maxSkip: d + 1`. The default `Infinity` considers all in-order token pairs.

ROUGE-N and ROUGE-S count repeated matching grams up to the smaller of their frequencies in the candidate and reference. Correcting earlier versions' set-based counting changes scores for repeated grams; rerun evaluation baselines when comparing versions.

Built-in scoring preserves token boundaries even when custom tokenizers return tokens containing spaces, quotes, or separators. For example, `["new york", "city"]` and `["new", "york city"]` no longer count as the same bigram. The exported `nGram()` and `skipBigram()` utilities retain their readable, space-joined output strings; those strings are not collision-free identifiers for arbitrary token arrays. Custom gram generators still receive the original tokens and their returned strings are used as identities, so those callbacks remain responsible for any encoding they need.

### Limitations

- **English-centric tokenizer**: The default Penn Treebank tokenizer is designed for English text. For other languages, provide a custom `tokenizer` function that appropriately segments text in your target language.
- **Heuristic sentence boundaries**: Abbreviations and names can be ambiguous. For domain-specific boundaries, supply a custom tokenizer to ROUGE-N/S or a custom segmenter to ROUGE-L.

## Jackknife Resampling

The package also exports utility functions, including jackknife resampling as described in the original paper:

```javascript
import { n as rougeN, jackKnife } from "js-rouge";

const reference = "police killed the gunman";
const candidates = [
  "police kill the gunman",
  "the gunman kill police",
  "the gunman police killed",
];

// Standard evaluation taking the arithmetic mean
jackKnife(candidates, reference, rougeN);

// Modified evaluation taking the distribution maximum
const distMax = (arr) => Math.max(...arr);
jackKnife(candidates, reference, rougeN, distMax);
```

## TypeScript

This package is written in TypeScript and includes type definitions. All functions and utilities are fully typed.

```typescript
import { n, l, s, jackKnife } from "js-rouge";

const score: number = n("candidate text", "reference text", { n: 2 });
```

### Exported Types

Option interfaces are exported for typing your own functions and configurations:

```typescript
import { n, RougeNOptions, RougeSOptions, RougeLOptions } from "js-rouge";

// Type your options objects
const opts: RougeNOptions = { n: 2, caseSensitive: false };
const score = n("candidate", "reference", opts);

// Type function parameters
function evaluateSummary(
  candidate: string,
  reference: string,
  opts: RougeNOptions,
): number {
  return n(candidate, reference, opts);
}
```

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
