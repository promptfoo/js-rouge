import { lcsIndices } from './lcs';
import * as utils from './utils';

export * from './utils';

/** Options for ROUGE-N evaluation */
export interface RougeNOptions {
  /** The size of the ngram used (default: 1) */
  n?: number;
  /** The beta value used for the f-measure (default: 1.0) */
  beta?: number;
  /** Whether comparison is case-sensitive (default: true) */
  caseSensitive?: boolean;
  /** Custom ngram generator function */
  nGram?: (tokens: string[], n: number) => string[];
  /** Custom string tokenizer */
  tokenizer?: (input: string) => string[];
}

/** Options for ROUGE-S (skip-bigram) evaluation */
export interface RougeSOptions {
  /** The beta value used for the f-measure (default: 1.0) */
  beta?: number;
  /** Whether comparison is case-sensitive (default: true) */
  caseSensitive?: boolean;
  /** Maximum token index distance (1 includes adjacent words; default: Infinity) */
  maxSkip?: number;
  /** Custom skip-bigram generator function */
  skipBigram?: (tokens: string[], maxSkip?: number) => string[];
  /** Custom string tokenizer */
  tokenizer?: (input: string) => string[];
}

/** Options for ROUGE-L (LCS) evaluation */
export interface RougeLOptions {
  /** The beta value used for the f-measure (default: 1.0) */
  beta?: number;
  /** Whether comparison is case-sensitive (default: true) */
  caseSensitive?: boolean;
  /** Custom LCS function returning an ordered token subsequence */
  lcs?: (a: string[], b: string[]) => string[];
  /** Custom sentence segmenter */
  segmenter?: (input: string) => string[];
  /** Custom string tokenizer */
  tokenizer?: (input: string) => string[];
}

function countMatchingGrams(candidate: string[], reference: string[]): number {
  const remaining = new Map<string, number>();
  for (const gram of reference) {
    remaining.set(gram, (remaining.get(gram) ?? 0) + 1);
  }

  let matches = 0;
  for (const gram of candidate) {
    const count = remaining.get(gram) ?? 0;
    if (count > 0) {
      matches++;
      remaining.set(gram, count - 1);
    }
  }
  return matches;
}

/** The built-in tokenizer expects sentences; custom tokenizers receive whole summaries. */
function tokenizeSummary(
  input: string,
  caseSensitive: boolean,
  tokenizer?: (input: string) => string[],
): string[] {
  const sentences = tokenizer ? [input] : utils.sentenceSegment(input);
  const tokenize = tokenizer ?? utils.treeBankTokenize;
  return sentences.flatMap((sentence) =>
    tokenize(caseSensitive ? sentence : sentence.toLowerCase()),
  );
}

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
export function n(cand: string, ref: string, opts?: RougeNOptions): number {
  if (cand.trim().length === 0) {
    throw new RangeError('Candidate cannot be an empty string');
  }
  if (ref.trim().length === 0) {
    throw new RangeError('Reference cannot be an empty string');
  }

  // Merge user-provided configuration with defaults
  const options = {
    n: 1,
    beta: 1.0,
    caseSensitive: true,
    nGram: utils.nGram,
    ...opts,
  };

  const candGrams = options.nGram(
    tokenizeSummary(cand, options.caseSensitive, options.tokenizer),
    options.n,
  );
  const refGrams = options.nGram(
    tokenizeSummary(ref, options.caseSensitive, options.tokenizer),
    options.n,
  );

  const matches = countMatchingGrams(candGrams, refGrams);

  if (matches === 0) {
    return 0;
  }

  const precision = matches / candGrams.length;
  const recall = matches / refGrams.length;

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
 * 	maxSkip: Infinity                   // Maximum token index distance
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
export function s(cand: string, ref: string, opts?: RougeSOptions): number {
  if (cand.trim().length === 0) {
    throw new RangeError('Candidate cannot be an empty string');
  }
  if (ref.trim().length === 0) {
    throw new RangeError('Reference cannot be an empty string');
  }

  // Merge user-provided configuration with defaults
  const options = {
    beta: 1.0,
    caseSensitive: true,
    maxSkip: Number.POSITIVE_INFINITY,
    skipBigram: utils.skipBigram,
    ...opts,
  };

  const candGrams = options.skipBigram(
    tokenizeSummary(cand, options.caseSensitive, options.tokenizer),
    options.maxSkip,
  );
  const refGrams = options.skipBigram(
    tokenizeSummary(ref, options.caseSensitive, options.tokenizer),
    options.maxSkip,
  );

  const skip2 = countMatchingGrams(candGrams, refGrams);

  if (skip2 === 0) {
    return 0;
  }
  const skip2Recall = skip2 / refGrams.length;
  const skip2Prec = skip2 / candGrams.length;

  return utils.fMeasure(skip2Prec, skip2Recall, options.beta);
}

/**
 * Computes the ROUGE-L score for a candidate summary
 *
 * Configuration object schema and defaults:
 * ```
 * {
 * 	beta: 1.0                           // The beta value used for the f-measure
 * 	caseSensitive: true                 // Whether comparison is case-sensitive
 * 	lcs: <inbuilt function>             // The longest common subsequence function
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
export function l(cand: string, ref: string, opts?: RougeLOptions): number {
  if (cand.trim().length === 0) {
    throw new RangeError('Candidate cannot be an empty string');
  }
  if (ref.trim().length === 0) {
    throw new RangeError('Reference cannot be an empty string');
  }

  // Merge user-provided configuration with defaults
  const options = {
    beta: 1.0,
    caseSensitive: true,
    lcs: utils.lcs,
    segmenter: utils.sentenceSegment,
    tokenizer: utils.treeBankTokenize,
    ...opts,
  };

  const tokenizeSentence = (sentence: string): string[] =>
    options.tokenizer(options.caseSensitive ? sentence : sentence.toLowerCase());
  const candSents = options.segmenter(cand).map(tokenizeSentence);
  const refSents = options.segmenter(ref).map(tokenizeSentence);

  const remaining = new Map<string, number>();
  let candLength = 0;
  for (const sentence of candSents) {
    for (const token of sentence) {
      candLength++;
      remaining.set(token, (remaining.get(token) ?? 0) + 1);
    }
  }
  const refLength = refSents.reduce((total, sentence) => total + sentence.length, 0);

  if (candLength === 0 || refLength === 0) {
    return 0;
  }

  let matches = 0;
  for (const reference of refSents) {
    const union = new Set<number>();
    for (const candidate of candSents) {
      for (const index of matchedReferenceIndices(candidate, reference, options.lcs)) {
        union.add(index);
      }
    }

    // Each reference position counts once, and candidate occurrences cannot be reused.
    for (const index of union) {
      const token = reference[index];
      const count = remaining.get(token) ?? 0;
      if (count > 0) {
        matches++;
        remaining.set(token, count - 1);
      }
    }
  }

  if (matches === 0) {
    return 0;
  }
  return utils.fMeasure(matches / candLength, matches / refLength, options.beta);
}

function matchedReferenceIndices(
  candidate: string[],
  reference: string[],
  getLcs: (a: string[], b: string[]) => string[],
): number[] {
  if (getLcs === utils.lcs) {
    return lcsIndices(candidate, reference);
  }

  // The public callback returns values, so align them to successive reference occurrences.
  const indices: number[] = [];
  let next = 0;
  for (const token of getLcs(candidate, reference)) {
    const index = reference.indexOf(token, next);
    if (index !== -1) {
      indices.push(index);
      next = index + 1;
    }
  }
  return indices;
}
