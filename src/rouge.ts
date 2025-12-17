import * as utils from './utils';
export * from './utils';

/**
 * Computes the ROUGE-N score for a candidate summary.
 *
 * Configuration object schema and defaults:
 * ```
 * {
 * 	n: 1                            // The size of the ngram used
 * 	beta: 1.0                       // The beta value used for the f-measure
 * 	caseSensitive: true             // Whether comparison is case-sensitive
 * 	nGram: <inbuilt function>,      // The ngram generator function
 * 	tokenizer: <inbuilt function>   // The string tokenizer
 * }
 * ```
 *
 * `nGram` has a type signature of ((Array<string>, number) => Array<string>)
 * `tokenizer` has a type signature of ((string) => Array<string)
 *
 * @method n
 * @param  {string}     cand        The candidate summary to be evaluated
 * @param  {string}     ref         The reference summary to be evaluated against
 * @param  {Object}     opts        Configuration options (see example)
 * @return {number}                 The ROUGE-N F-score
 */
export function n(
  cand: string,
  ref: string,
  opts?: {
    n?: number;
    beta?: number;
    caseSensitive?: boolean;
    nGram?: (tokens: string[], n: number) => string[];
    tokenizer?: (input: string) => string[];
  }
): number {
  if (cand.length === 0) throw new RangeError('Candidate cannot be an empty string');
  if (ref.length === 0) throw new RangeError('Reference cannot be an empty string');

  // Merge user-provided configuration with defaults
  const options = {
    n: 1,
    beta: 1.0,
    caseSensitive: true,
    nGram: utils.nGram,
    tokenizer: utils.treeBankTokenize,
    ...opts,
  };

  const candText = options.caseSensitive ? cand : cand.toLowerCase();
  const refText = options.caseSensitive ? ref : ref.toLowerCase();

  const candGrams = options.nGram(options.tokenizer(candText), options.n);
  const refGrams = options.nGram(options.tokenizer(refText), options.n);

  const match = utils.intersection(candGrams, refGrams);

  if (match.length === 0) {
    return 0;
  }

  const precision = match.length / candGrams.length;
  const recall = match.length / refGrams.length;

  return utils.fMeasure(precision, recall, options.beta);
}

/**
 * Computes the ROUGE-S score for a candidate summary.
 *
 * Configuration object schema and defaults:
 * ```
 * {
 * 	beta: 1.0                           // The beta value used for the f-measure
 * 	caseSensitive: true                 // Whether comparison is case-sensitive
 * 	maxSkip: Infinity                   // Maximum skip distance between words
 * 	skipBigram: <inbuilt function>,     // The skip-bigram generator function
 * 	tokenizer: <inbuilt function>       // The string tokenizer
 * }
 * ```
 *
 * `skipBigram` has a type signature of ((Array<string>, number) => Array<string>)
 * `tokenizer` has a type signature of ((string) => Array<string)
 *
 * @method s
 * @param  {string}     cand        The candidate summary to be evaluated
 * @param  {string}     ref         The reference summary to be evaluated against
 * @param  {Object}     opts        Configuration options (see example)
 * @return {number}                 The ROUGE-S score
 */
export function s(
  cand: string,
  ref: string,
  opts?: {
    beta?: number;
    caseSensitive?: boolean;
    maxSkip?: number;
    skipBigram?: (tokens: string[], maxSkip?: number) => string[];
    tokenizer?: (input: string) => string[];
  }
): number {
  if (cand.length === 0) throw new RangeError('Candidate cannot be an empty string');
  if (ref.length === 0) throw new RangeError('Reference cannot be an empty string');

  // Merge user-provided configuration with defaults
  const options = {
    beta: 1.0,
    caseSensitive: true,
    maxSkip: Infinity,
    skipBigram: utils.skipBigram,
    tokenizer: utils.treeBankTokenize,
    ...opts,
  };

  const candText = options.caseSensitive ? cand : cand.toLowerCase();
  const refText = options.caseSensitive ? ref : ref.toLowerCase();

  const candGrams = options.skipBigram(options.tokenizer(candText), options.maxSkip);
  const refGrams = options.skipBigram(options.tokenizer(refText), options.maxSkip);

  const skip2 = utils.intersection(candGrams, refGrams).length;

  if (skip2 === 0) {
    return 0;
  } else {
    const skip2Recall = skip2 / refGrams.length;
    const skip2Prec = skip2 / candGrams.length;

    return utils.fMeasure(skip2Prec, skip2Recall, options.beta);
  }
}

/**
 * Computes the ROUGE-L score for a candidate summary
 *
 * Configuration object schema and defaults:
 * ```
 * {
 * 	beta: 1.0                           // The beta value used for the f-measure
 * 	caseSensitive: true                 // Whether comparison is case-sensitive
 * 	lcs: <inbuilt function>             // The least common subsequence function
 * 	segmenter: <inbuilt function>,      // The sentence segmenter
 * 	tokenizer: <inbuilt function>       // The string tokenizer
 * }
 * ```
 *
 * `lcs` has a type signature of ((Array<string>, Array<string>) => Array<string>)
 * `segmenter` has a type signature of ((string) => Array<string)
 * `tokenizer` has a type signature of ((string) => Array<string)
 *
 * @method l
 * @param  {string}     cand        The candidate summary to be evaluated
 * @param  {string}     ref         The reference summary to be evaluated against
 * @param  {Object}     opts        Configuration options (see example)
 * @return {number}                 The ROUGE-L score
 */
export function l(
  cand: string,
  ref: string,
  opts?: {
    beta?: number;
    caseSensitive?: boolean;
    lcs?: (a: string[], b: string[]) => string[];
    segmenter?: (input: string) => string[];
    tokenizer?: (input: string) => string[];
  }
): number {
  if (cand.length === 0) throw new RangeError('Candidate cannot be an empty string');
  if (ref.length === 0) throw new RangeError('Reference cannot be an empty string');

  // Merge user-provided configuration with defaults
  const options = {
    beta: 1.0,
    caseSensitive: true,
    lcs: utils.lcs,
    segmenter: utils.sentenceSegment,
    tokenizer: utils.treeBankTokenize,
    ...opts,
  };

  const candText = options.caseSensitive ? cand : cand.toLowerCase();
  const refText = options.caseSensitive ? ref : ref.toLowerCase();

  const candSents = options.segmenter(candText);
  const refSents = options.segmenter(refText);

  const candWords = options.tokenizer(candText);
  const refWords = options.tokenizer(refText);

  const lcsAcc = refSents.map((r) => {
    const rTokens = options.tokenizer(r);
    const lcsUnion = new Set(candSents.flatMap((c) => options.lcs(options.tokenizer(c), rTokens)));

    return lcsUnion.size;
  });

  // Sum the array as quickly as we can
  let lcsSum = 0;
  while (lcsAcc.length) lcsSum += lcsAcc.pop() || 0;

  if (lcsSum === 0) {
    return 0;
  }

  // Recall = LCS / |reference| (how much of reference is captured)
  // Precision = LCS / |candidate| (how precise is the candidate)
  const lcsRecall = lcsSum / refWords.length;
  const lcsPrec = lcsSum / candWords.length;

  return utils.fMeasure(lcsPrec, lcsRecall, options.beta);
}
