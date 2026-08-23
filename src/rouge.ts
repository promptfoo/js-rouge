import { lcsIndices as builtInLcsIndices } from './lcs';
import * as utils from './utils';
import { validateBeta, validateMaxSkip, validateNGramSize } from './validation';

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
  /**
   * Custom LCS function returning an ordered token subsequence.
   *
   * Returned values are aligned to successive reference occurrences from left to
   * right. Use `lcsIndices` to select exact positions when the reference repeats tokens.
   */
  lcs?: (a: string[], b: string[]) => string[];
  /**
   * Custom LCS function returning exact, strictly increasing reference indices.
   * Cannot be specified with `lcs`; providing both throws `RangeError`.
   */
  lcsIndices?: (candidate: string[], reference: string[]) => number[];
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
  const tokenize = tokenizer ?? utils.treeBankTokenize;
  const sentences = tokenize === utils.treeBankTokenize ? utils.sentenceSegment(input) : [input];
  return sentences.flatMap((sentence) =>
    tokenize(caseSensitive ? sentence : sentence.toLowerCase()),
  );
}

/** JSON string tokens remain unambiguous when the built-in gram utilities join them. */
function encodeTokens(tokens: string[]): string[] {
  return tokens.map((token) => JSON.stringify(token));
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

  const {
    n: size = 1,
    beta = 1.0,
    caseSensitive = true,
    nGram = utils.nGram,
    tokenizer,
  } = opts ?? {};
  validateNGramSize(size);
  validateBeta(beta);

  const getGrams = (input: string): string[] => {
    const tokens = tokenizeSummary(input, caseSensitive, tokenizer);
    return nGram(nGram === utils.nGram ? encodeTokens(tokens) : tokens, size);
  };
  const candGrams = getGrams(cand);
  const refGrams = getGrams(ref);

  const matches = countMatchingGrams(candGrams, refGrams);

  if (matches === 0) {
    return 0;
  }

  const precision = matches / candGrams.length;
  const recall = matches / refGrams.length;

  return utils.fMeasure(precision, recall, beta);
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

  const {
    beta = 1.0,
    caseSensitive = true,
    maxSkip = Number.POSITIVE_INFINITY,
    skipBigram = utils.skipBigram,
    tokenizer,
  } = opts ?? {};
  validateMaxSkip(maxSkip);
  validateBeta(beta);

  const getGrams = (input: string): string[] => {
    const tokens = tokenizeSummary(input, caseSensitive, tokenizer);
    return skipBigram(skipBigram === utils.skipBigram ? encodeTokens(tokens) : tokens, maxSkip);
  };
  const candGrams = getGrams(cand);
  const refGrams = getGrams(ref);

  const skip2 = countMatchingGrams(candGrams, refGrams);

  if (skip2 === 0) {
    return 0;
  }
  const skip2Recall = skip2 / refGrams.length;
  const skip2Prec = skip2 / candGrams.length;

  return utils.fMeasure(skip2Prec, skip2Recall, beta);
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
 * 	lcsIndices: undefined                // A position-aware custom LCS function
 * 	segmenter: <inbuilt function>,      // The sentence segmenter
 * 	tokenizer: <inbuilt function>       // The string tokenizer
 * }
 * ```
 *
 * `lcs` has a type signature of ((Array<string>, Array<string>) => Array<string>)
 * `lcsIndices` has a type signature of ((Array<string>, Array<string>) => Array<number>)
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

  const {
    beta = 1.0,
    caseSensitive = true,
    lcs: getLcs = utils.lcs,
    lcsIndices: getLcsIndices,
    segmenter = utils.sentenceSegment,
    tokenizer = utils.treeBankTokenize,
  } = opts ?? {};
  if (opts?.lcs !== undefined && getLcsIndices !== undefined) {
    throw new RangeError('ROUGE-L options cannot specify both lcs and lcsIndices');
  }
  validateBeta(beta);

  const tokenizeSentence = (sentence: string): string[] =>
    tokenizer(caseSensitive ? sentence : sentence.toLowerCase());
  const candSents = segmenter(cand).map(tokenizeSentence);
  const refSents = segmenter(ref).map(tokenizeSentence);

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
      for (const index of matchedReferenceIndices(candidate, reference, getLcs, getLcsIndices)) {
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
  return utils.fMeasure(matches / candLength, matches / refLength, beta);
}

function matchedReferenceIndices(
  candidate: string[],
  reference: string[],
  getLcs: (a: string[], b: string[]) => string[],
  getLcsIndices?: (candidate: string[], reference: string[]) => number[],
): number[] {
  if (getLcsIndices !== undefined) {
    return validateCustomLcsIndices(candidate, reference, getLcsIndices(candidate, reference));
  }
  if (getLcs === utils.lcs) {
    return builtInLcsIndices(candidate, reference);
  }

  return alignReferenceIndices(candidate, reference, getLcs(candidate, reference));
}

function validateCustomLcsIndices(
  candidate: string[],
  reference: string[],
  result: number[],
): number[] {
  if (!Array.isArray(result)) {
    throw new RangeError('Custom lcsIndices must return an array of reference token indices');
  }

  const indices: number[] = [];
  const tokens: string[] = [];
  let previous = -1;
  for (const index of result) {
    if (
      typeof index !== 'number' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= reference.length ||
      index <= previous
    ) {
      throw new RangeError(
        'Custom lcsIndices must return strictly increasing integer indices within the reference',
      );
    }
    indices.push(index);
    tokens.push(reference[index]);
    previous = index;
  }

  if (!isSubsequence(tokens, candidate)) {
    throw new RangeError(
      'Custom lcsIndices must select reference tokens that form a subsequence of the candidate',
    );
  }
  return indices;
}

function alignReferenceIndices(
  candidate: string[],
  reference: string[],
  result: string[],
): number[] {
  if (!Array.isArray(result)) {
    throw new RangeError('Custom lcs must return an array of token strings');
  }

  const tokens: string[] = [];
  for (const token of result) {
    if (typeof token !== 'string') {
      throw new RangeError('Custom lcs must return an array of token strings');
    }
    tokens.push(token);
  }
  if (!isSubsequence(tokens, candidate)) {
    throw new RangeError('Custom lcs must return a common subsequence of candidate and reference');
  }

  const indices: number[] = [];
  let next = 0;
  for (const token of tokens) {
    const index = reference.indexOf(token, next);
    if (index === -1) {
      throw new RangeError(
        'Custom lcs must return a common subsequence of candidate and reference',
      );
    }
    indices.push(index);
    next = index + 1;
  }
  return indices;
}

function isSubsequence(tokens: string[], sequence: string[]): boolean {
  let tokenIndex = 0;
  for (const token of sequence) {
    if (token === tokens[tokenIndex]) {
      tokenIndex++;
      if (tokenIndex === tokens.length) {
        return true;
      }
    }
  }
  return tokens.length === 0;
}
