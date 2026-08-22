import { GATE_EXCEPTIONS, GATE_SUBSTITUTIONS, TREEBANK_CONTRACTIONS } from './constants';
import { lcsIndices } from './lcs';
import { validateBeta, validateMaxSkip, validateNGramSize } from './validation';

/**
 * Splits a sentence into an array of word tokens
 * in accordance with the Penn Treebank guidelines.
 *
 * NOTE: This method assumes that the input is a single
 * sentence only. Providing multiple sentences within a
 * single string can trigger edge cases which have not
 * been accounted for.
 *
 * Adapted from Titus Wormer's port of the Penn Treebank Tokenizer
 * found at https://gist.github.com/wooorm/8504606
 *
 *
 * @method treeBankTokenize
 * @param  {string}           input     The sentence to be tokenized
 * @return {Array<string>}              An array of word tokens
 */
export function treeBankTokenize(input: string): string[] {
  // Contraction rules below expect spaces, including at word boundaries.
  const text = input.trim().replace(/\s+/g, ' ');
  if (text.length === 0) {
    return [];
  }

  // Does the following things in order of appearance by line:
  // 1. Replace quotes at the sentence start position with double ticks
  // 2. Wrap spaces around a double quote preceded by opening brackets
  // 3. Wrap spaces around a non-unicode ellipsis
  // 4. Separate commas/colons except before digits, and wrap other punctuation (;@#$%&)
  // 5. Split a final period, allowing closing brackets, quotes, and whitespace after it.
  //    Do not split ellipses. Sentence tokenization is assumed as a preprocessing step.
  // 6. Wrap spaces around all exclamation marks and question marks
  // 7. Wrap spaces around opening and closing brackets
  // 8. Wrap spaces around en and em-dashes
  let parse = text
    .replace(/^"/, ' `` ')
    .replace(/([ ([{<])"/g, '$1 `` ')
    .replace(/\.\.\.*/g, ' ... ')
    .replace(/[:,](?!\d)/g, ' $& ')
    .replace(/[;@#$%&]/g, ' $& ')
    .replace(/([^.])(\.)([\])}>"'\s]*)$/g, '$1 $2$3 ')
    .replace(/[?!]/g, ' $& ')
    .replace(/[\][(){}<>]/g, ' $& ')
    .replace(/---*/g, ' -- ');

  // Wrap spaces at the start and end of the sentence for consistency
  // i.e. reduce the number of Regex matches required
  parse = ` ${parse} `;

  // Does the following things in order of appearance by line:
  // 1. Replace double quotes with a pair of single quotes wrapped with spaces
  // 2. Wrap possessive or closing single quotes
  // 3. Add a space before single quotes followed by `s`, `m`, or `d` and a space
  // 4. Add a space before occurrences of `'ll`, `'re`, `'ve` or `n't`
  parse = parse
    .replace(/"/g, " '' ")
    .replace(/([^'])' /g, "$1 ' ")
    .replace(/'([sSmMdD]) /g, " '$1 ")
    .replace(/('ll|'LL|'re|'RE|'ve|'VE|n't|N'T) /g, ' $1 ');

  for (const contraction of TREEBANK_CONTRACTIONS) {
    // Break uncommon contractions with a space and wrap-in spaces
    parse = parse.replace(contraction, ' $1 $2 ');
  }

  // Concatenate double spaces and remove start/end spaces
  parse = parse.replace(/ {2,}/g, ' ').replace(/^ | $/g, '');

  // Split on spaces (original and inserted) to return the tokenized result
  return parse.split(' ');
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const abbrvReg = new RegExp(`\\b(${GATE_SUBSTITUTIONS.map(escapeRegExp).join('|')})[.!?] ?$`, 'i');
const acronymReg = /[ |.][A-Z].?$/i;
const breakReg = /[\r\n]+/;
// Match a bounded ellipsis suffix to avoid excessive backtracking.
const ellipseReg = /\.{2,10}$/;
const excepReg = new RegExp(`\\b(${GATE_EXCEPTIONS.map(escapeRegExp).join('|')})[.!?] ?$`, 'i');
const sentenceSuffixLength = Math.max(10, ...GATE_SUBSTITUTIONS.map((word) => word.length + 2));
const geographicAcronymReg = /\b(?:U\.S(?:\.A)?|E\.U)\.$/i;
// Conservative acronym boundaries follow pragmatic_segmenter's sentence-starter approach:
// https://github.com/diasks2/pragmatic_segmenter/blob/master/lib/pragmatic_segmenter/languages/common.rb
const sentenceStarterReg =
  /^(?:A|Being|Did|For|He|How|However|I|In|It|Millions|More|She|That|The|There|They|We|What|When|Where|Who|Why)\b/;
const closingDelimiterReg = /[\])}>"']/;
const closingBracketReg = /[\])}>]/;

function canEndAfterAbbreviation(suffix: string, next: string): boolean {
  return (
    strIsTitleCase(next) &&
    !excepReg.test(suffix) &&
    (!geographicAcronymReg.test(suffix) || sentenceStarterReg.test(next.trimStart()))
  );
}

/** Keep merged fragments separate; boundary rules only need a suffix and word casing. */
class SentenceBuffer {
  #parts: string[] = [];
  #normalizedThrough = 0;
  #words: { titleCase: boolean; lowerCase: boolean }[] = [];
  hasLineBreaks = false;
  startsWithTitleCase = false;

  constructor(text: string) {
    this.append(trimSpaces(text));
  }

  get empty(): boolean {
    return this.#words.length === 0;
  }

  get lastWordIsLowerCase(): boolean {
    return this.#words.at(-1)?.lowerCase ?? true;
  }

  get previousWordIsTitleCase(): boolean {
    return this.#words.at(-2)?.titleCase ?? false;
  }

  get suffix(): string {
    let suffix = '';
    for (let i = this.#parts.length - 1; i >= 0 && suffix.length < sentenceSuffixLength; i--) {
      suffix = `${this.#parts[i].slice(suffix.length - sentenceSuffixLength)}${suffix}`;
    }
    return suffix;
  }

  append(text: string): void {
    if (text.length === 0) {
      return;
    }

    // A merge without separating whitespace can continue the previous word.
    const previous = this.#words.at(-1);
    for (const match of text.matchAll(/\S+/g)) {
      const word = match[0];
      const lowerCase = word === word.toLowerCase();
      if (match.index === 0 && previous && !/\s/.test(this.suffix.at(-1) ?? '')) {
        previous.lowerCase = previous.lowerCase && lowerCase;
      } else {
        const titleCase = strIsTitleCase(word);
        if (this.empty) {
          this.startsWithTitleCase = titleCase;
        }
        this.#words.push({ titleCase, lowerCase });
        if (this.#words.length > 2) {
          this.#words.shift();
        }
      }
    }

    this.hasLineBreaks = this.hasLineBreaks || breakReg.test(text);
    this.#parts.push(text);
  }

  trimEnd(allWhitespace = false): void {
    while (this.#parts.length > 0) {
      const index = this.#parts.length - 1;
      const part = this.#parts[index];
      const trimmed = allWhitespace ? part.trimEnd() : trimEndSpaces(part);
      if (trimmed.length > 0) {
        this.#parts[index] = trimmed;
        break;
      }
      this.#parts.pop();
    }
    this.#normalizedThrough = Math.min(this.#normalizedThrough, this.#parts.length);
  }

  normalizeWhitespace(): void {
    // Normalize each fragment once, including whitespace at fragment boundaries.
    let write = this.#normalizedThrough;
    for (let read = write; read < this.#parts.length; read++) {
      let part = this.#parts[read].replace(/\s+/g, ' ');
      if ((write === 0 || this.#parts[write - 1].endsWith(' ')) && part.startsWith(' ')) {
        part = part.slice(1);
      }
      if (part.length > 0) {
        this.#parts[write++] = part;
      }
    }
    this.#parts.length = write;
    this.trimEnd(true);
    this.#normalizedThrough = this.#parts.length;
    this.hasLineBreaks = false;
  }

  text(): string {
    return this.#parts.join('');
  }
}

/**
 * Splits a body of text into an array of sentences
 * using a rule-based segmentation approach.
 *
 * Adapted from Spencer Mountain's nlp_compromise library
 * found at https://github.com/spencermountain/nlp_compromise/
 *
 * @method sentenceSegment
 * @param  {string}         input     The document to be segmented
 * @return {Array<string>}            An array of sentences
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Sentence segmentation requires complex NLP logic
export function sentenceSegment(input: string): string[] {
  if (input.length === 0) {
    return [];
  }

  // Split sentences naively based on common terminals (.?!")
  const chunks = sentenceChunks(input);

  const acc: string[] = [];
  let pending: SentenceBuffer | undefined;
  for (let idx = 0; idx < chunks.length; idx++) {
    if (pending || chunks[idx]) {
      const chunk = pending ?? new SentenceBuffer(chunks[idx]);
      pending = undefined;
      // Trim only spaces (i.e. preserve line breaks/carriage feeds)
      chunk.trimEnd();

      // Separators are not sentences and have no character to test for titlecase.
      if (chunk.empty) {
        continue;
      }

      if (chunk.hasLineBreaks) {
        if (chunks[idx + 1] && chunk.startsWithTitleCase) {
          // Catch line breaks embedded within valid sentences
          // i.e. sentences that start with a capital letter
          // and normalize every wrap before reprocessing the joined chunk.
          chunk.append(` ${chunks[idx + 1]}`);
          chunk.normalizeWhitespace();
          pending = chunk;
        } else {
          // Assume that all other embedded line breaks are
          // valid sentence breakpoints
          for (const line of chunk.text().split(breakReg)) {
            const sentence = line.trim();
            if (sentence.length > 0) {
              acc.push(sentence);
            }
          }
        }
      } else if (chunks[idx + 1] && abbrvReg.test(chunk.suffix)) {
        const nextChunk = chunks[idx + 1];
        if (canEndAfterAbbreviation(chunk.suffix, nextChunk)) {
          // Catch abbreviations followed by a capital letter and treat as a boundary.
          acc.push(chunk.text());
        } else {
          // Catch common abbreviations and merge them with a delimiting space
          chunk.append(` ${trimSpaces(nextChunk.replace(/ +/g, ' '))}`);
          pending = chunk;
        }
      } else if (chunks[idx + 1] && acronymReg.test(chunk.suffix)) {
        if (chunk.lastWordIsLowerCase) {
          // Catch small-letter abbreviations and merge them.
          chunk.append(` ${chunks[idx + 1].replace(/ +/g, ' ')}`);
          pending = chunk;
        } else {
          const nextSentence = chunks[idx + 2];
          if (nextSentence && chunk.previousWordIsTitleCase && strIsTitleCase(nextSentence)) {
            // Catch name abbreviations (e.g. Albert I. Jones) by checking if
            // the previous and next words are all capitalized. Normalize line
            // wrapping in the separator so it cannot split the joined name again.
            chunk.append(chunks[idx + 1].replace(/\s+/g, ' ') + nextSentence);
            pending = chunk;
            idx++;
          } else {
            // Retain a boundary for other entities and unterminated final fragments.
            acc.push(chunk.text());
          }
        }
      } else if (chunks[idx + 1] && ellipseReg.test(chunk.suffix)) {
        // Catch mid-sentence ellipses (and their derivatives) and merge them
        const nextChunk = chunks[idx + 1];
        chunk.append(nextChunk.replace(/ +/g, ' '));
        if (!(nextChunk.trim() || breakReg.test(nextChunk)) && chunks[idx + 2]) {
          // Keep the separator inside the sentence; leave line breaks to the newline rule.
          chunk.append(chunks[idx + 2].replace(/ +/g, ' '));
          idx++;
        }
        pending = chunk;
      } else {
        acc.push(chunk.text());
      }
    }
  }

  // If no matches were found, return the input treated as a single sentence
  return acc.length === 0 ? [input] : acc;
}

/** Scan sentence boundaries once, preserving the former captured-split layout. */
function sentenceChunks(input: string): string[] {
  const chunks: string[] = [];
  let lastEnd = 0;
  let start = -1;

  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === '\r' || char === '\n') {
      // A match cannot cross CR/LF; its prefix remains unmatched text.
      start = -1;
      continue;
    }
    if (start === -1) {
      if (/\S/.test(char)) {
        start = index;
      }
      // A terminal must follow the initial character, even if it is punctuation.
      continue;
    }
    if (char === '.' || char === '?' || char === '!') {
      const end = sentenceEnd(input, index);
      if (end === -1) {
        continue;
      }
      chunks.push(input.slice(lastEnd, start), input.slice(start, end));
      lastEnd = end;
      index = end - 1;
      start = -1;
    }
  }

  chunks.push(input.slice(lastEnd));
  return chunks;
}

/** Include closing delimiters, or return -1 when the sentence continues. */
function sentenceEnd(input: string, index: number): number {
  let end = index + 1;
  let closed = false;
  while (end < input.length) {
    if (closingDelimiterReg.test(input[end])) {
      closed = true;
      end++;
      continue;
    }

    // A bracket can follow spaces; a quote after spaces may open the next sentence.
    let next = end;
    while (next < input.length && /[^\S\r\n]/.test(input[next])) {
      next++;
    }
    if (next > end && next < input.length && closingBracketReg.test(input[next])) {
      end = next;
      continue;
    }
    break;
  }

  if (end < input.length && !/\s/.test(input[end])) {
    return -1;
  }
  if (!closed) {
    return end;
  }

  let next = end;
  while (next < input.length && /\s/.test(input[next])) {
    next++;
  }
  if (next === input.length) {
    return end;
  }
  const initial = input[next];
  if (/[,;:]/.test(initial) || initial.toUpperCase() !== initial) {
    return -1;
  }

  const suffix = input.slice(Math.max(0, index + 1 - sentenceSuffixLength), index + 1);
  // Keep bracketed ellipses inside the surrounding sentence.
  if (ellipseReg.test(suffix) && closingBracketReg.test(input.slice(index + 1, end))) {
    return -1;
  }
  if (!abbrvReg.test(suffix)) {
    return end;
  }
  let wordEnd = next + 1;
  while (wordEnd < input.length && !/\s/.test(input[wordEnd])) {
    wordEnd++;
  }
  return canEndAfterAbbreviation(suffix, input.slice(next, wordEnd)) ? end : -1;
}

function trimSpaces(input: string): string {
  let start = 0;
  let end = input.length;
  while (start < end && input[start] === ' ') {
    start++;
  }
  while (end > start && input[end - 1] === ' ') {
    end--;
  }
  return input.slice(start, end);
}

function trimEndSpaces(input: string): string {
  let end = input.length;
  while (end > 0 && input[end - 1] === ' ') {
    end--;
  }
  return input.slice(0, end);
}

/**
 * Checks if a string is titlecase
 * @method strIsTitleCase
 * @param  {string}   input       The string to be checked
 * @return {boolean}              True if the string is titlecase and false otherwise
 */
export function strIsTitleCase(input: string): boolean {
  const firstChar = input.trim().slice(0, 1);
  return firstChar.length > 0 && charIsUpperCase(firstChar);
}

/**
 * Checks if a character is uppercase (i18n-compatible)
 * @method charIsUpperCase
 * @param  {string}   input     The character to be tested
 * @return {boolean}            True if the character is uppercase and false otherwise.
 */
export function charIsUpperCase(input: string): boolean {
  if (input.length !== 1) {
    throw new RangeError('Input should be a single character');
  }

  // Use locale-aware comparison to support international characters
  return input.toUpperCase() === input && input.toLowerCase() !== input;
}

/**
 * Memoizes a function using a Map
 *
 * **Memory Warning**: The cache is unbounded and will grow indefinitely for unique inputs.
 * In long-running processes with many unique inputs, consider using a bounded cache
 * implementation (e.g., LRU cache) or periodically clearing the memoized function.
 *
 * @method memoize
 * @param  {Function} func    The function to be memoized
 * @param  {Function} Store   The data store constructor. Defaults to the ES6-inbuilt Map function.
 *                            A store should implement `has`, `get`, and `set` methods.
 * @return {Function}         A closure of the memoization cache and the original function
 */
function memoize<T, R>(func: (arg: T) => R, Store: new () => Map<T, R> = Map): (arg: T) => R {
  return (() => {
    const cache = new Store();

    return (n: T) => {
      if (cache.has(n)) {
        const cachedResult = cache.get(n);
        if (cachedResult !== undefined) {
          return cachedResult;
        }
      }
      const result = func(n);
      cache.set(n, result);
      return result;
    };
  })();
}

/**
 * Computes the factorial of a number.
 *
 * This function uses a tail-recursive call to avoid
 * blowing the stack when computing inputs with a large
 * recursion depth.
 *
 * @method factRec
 * @param  {number} x     The number for which the factorial is to be computed
 * @param  {number} acc   The starting value for the computation. Defaults to 1.
 * @return {number}       The factorial result
 */
function factRec(x: number, acc = 1): number {
  if (x < 0) {
    throw new RangeError('Input must be a positive number');
  }
  return x < 2 ? acc : factRec(x - 1, x * acc);
}

/**
 * Memoized factorial function.
 *
 * **Memory Note**: Results are cached indefinitely. In typical ROUGE usage,
 * factorial is called with small values (≤20) so memory impact is negligible.
 * The cache size is bounded by the range of valid factorial inputs that don't
 * overflow JavaScript's number type (approximately n ≤ 170).
 */
export const fact = memoize(factRec);

/**
 * Returns the skip bigrams for an array of word tokens.
 *
 * @method skipBigram
 * @param  {Array<string>}    tokens      An array of word tokens
 * @param  {number}           maxSkip     Maximum token index distance; 1 includes adjacent words. Defaults to Infinity (all pairs).
 * @return {Array<string>}                An array of skip bigram strings
 */
export function skipBigram(tokens: string[], maxSkip: number = Number.POSITIVE_INFINITY): string[] {
  validateMaxSkip(maxSkip);
  if (tokens.length < 2) {
    throw new RangeError('Input must have at least two words');
  }

  const acc: string[] = [];
  for (let baseIdx = 0; baseIdx < tokens.length - 1; baseIdx++) {
    const maxIdx = Math.min(baseIdx + 1 + maxSkip, tokens.length);
    for (let sweepIdx = baseIdx + 1; sweepIdx < maxIdx; sweepIdx++) {
      acc.push(`${tokens[baseIdx]} ${tokens[sweepIdx]}`);
    }
  }

  return acc;
}

interface NGramOptions {
  start: boolean;
  end: boolean;
  val: string;
}

export const NGRAM_DEFAULT_OPTS: NGramOptions = {
  start: false,
  end: false,
  val: '<S>',
};

/**
 * Returns n-grams for an array of word tokens.
 *
 * @method nGram
 * @param  {Array<string>}          tokens    An array of word tokens
 * @param  {number}                 n         The size of the n-gram. Defaults to 2.
 * @param  {Object}                 pad       String padding options. See example.
 * @return {Array<string>}                    An array of n-gram strings
 */
export function nGram(tokens: string[], n = 2, pad: Partial<NGramOptions> = {}): string[] {
  validateNGramSize(n);

  if (tokens.length < n) {
    throw new RangeError('ngram size cannot be larger than the number of tokens available');
  }

  let workingTokens = tokens;

  if (Object.keys(pad).length > 0) {
    const config = {
      start: pad.start ?? NGRAM_DEFAULT_OPTS.start,
      end: pad.end ?? NGRAM_DEFAULT_OPTS.end,
      val: pad.val ?? NGRAM_DEFAULT_OPTS.val,
    };

    // Clone the input token array to avoid mutating the source data
    const tempTokens = tokens.slice(0);

    if (config.start) {
      for (let i = 0; i < n - 1; i++) {
        tempTokens.unshift(config.val);
      }
    }
    if (config.end) {
      for (let i = 0; i < n - 1; i++) {
        tempTokens.push(config.val);
      }
    }

    workingTokens = tempTokens;
  }

  const acc: string[] = [];
  for (let idx = 0; idx < workingTokens.length - n + 1; idx++) {
    acc.push(workingTokens.slice(idx, idx + n).join(' '));
  }

  return acc;
}

/**
 * Calculates C(val, 2), i.e. the number of ways 2
 * items can be chosen from `val` items.
 *
 * @method comb2
 * @param  {number} val     The total number of items to choose from
 * @return {number}         The number of ways in which 2 items can be chosen from `val`
 */
export function comb2(val: number): number {
  if (val < 2) {
    throw new RangeError('Input must be greater than 2');
  }
  return 0.5 * val * (val - 1);
}

/**
 * Computes the arithmetic mean of an array
 * @method arithmeticMean
 * @param  {Array<number>}   input    Data distribution
 * @return {number}                   The mean of the distribution
 */
export function arithmeticMean(input: number[]): number {
  if (input.length === 0) {
    throw new RangeError('Input array must have at least 1 element');
  }
  return input.reduce((x, y) => x + y) / input.length;
}

/**
 * Evaluates the jackknife resampling result for a set of
 * candidate summaries vs. a reference summary.
 *
 * @method jackKnife
 * @param  {Array<string>}  cands      An array of candidate summaries to be evaluated
 * @param  {string}         ref        The reference summary to be evaluated against
 * @param  {Function}       func       The function used to evaluate a candidate against a reference.
 *                                     Should be of the type signature (string, string) => number
 * @param  {Function}       test       The function used to compute the test statistic.
 *                                     Defaults to the arithmetic mean.
 *                                     Should be of the type signature (Array<number>) => number
 * @return {number}                    The result computed by applying `test` to the resampled data
 */
export function jackKnife(
  cands: string[],
  ref: string,
  func: (x: string, y: string) => number,
  test: (x: number[]) => number = arithmeticMean,
): number {
  if (cands.length < 2) {
    throw new RangeError('Candidate array must contain more than one element');
  }

  const pairs: number[] = cands.map((c) => func(c, ref));

  const acc: number[] = [];
  for (let idx = 0; idx < pairs.length; idx++) {
    // Clone the array and remove one element
    const leaveOneOut = pairs.slice(0);
    leaveOneOut.splice(idx, 1);

    acc.push(Math.max(...leaveOneOut));
  }

  return test(acc);
}

/**
 * Calculates the ROUGE f-measure for a given precision
 * and recall score.
 *
 * Uses the standard F-beta formula:
 * F_β = ((1 + β²) × P × R) / (β² × P + R)
 *
 * Beta controls the tradeoff between precision and recall:
 * - beta = 0: Pure precision (F₀ = P)
 * - beta = 1: F1 score (harmonic mean, equal weight)
 * - beta = 2: F2 score (weighs recall twice as much as precision)
 * - beta = Infinity: Pure recall
 *
 * @method fMeasure
 * @param  {number}     p       Precision score (0 to 1)
 * @param  {number}     r       Recall score (0 to 1)
 * @param  {number}     beta    Weighing value (precision vs. recall). Defaults to 1.0 (F1).
 * @return {number}             Computed f-score
 */
export function fMeasure(p: number, r: number, beta = 1.0): number {
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError('Precision value p must have bounds 0 ≤ p ≤ 1');
  }
  if (!Number.isFinite(r) || r < 0 || r > 1) {
    throw new RangeError('Recall value r must have bounds 0 ≤ r ≤ 1');
  }
  validateBeta(beta);

  // Handle special cases
  if (p === r) {
    return p;
  }
  if (beta === Number.POSITIVE_INFINITY) {
    return r; // β → ∞ means pure recall
  }
  if (p === 0 || r === 0) {
    return 0;
  }

  if (beta === 0) {
    return p;
  }

  // F-beta(P, R) = F-(1/beta)(R, P). This keeps the weight at least one.
  if (beta < 1) {
    return fMeasure(r, p, 1 / beta);
  }
  // Scale by the smaller score instead of multiplying precision and recall.
  if (p > r) {
    const inverseBeta = 1 / beta;
    const weight = inverseBeta * inverseBeta;
    return r * ((1 + weight) / (1 + weight * (r / p)));
  }

  const betaSq = beta * beta;
  if (Number.isFinite(betaSq)) {
    return p * ((1 + betaSq) / (1 + betaSq * (p / r)));
  }

  // Multiplying precision by beta first rescales even the smallest subnormal.
  // Here 1 / beta² is too small to affect the rounded numerator weight.
  const ratio = ((p * beta) / r) * beta;
  return ratio === Number.POSITIVE_INFINITY ? r : r * (ratio / (1 + ratio));
}

/**
 * Computes the set intersection of two arrays
 *
 * @method intersection
 * @template T
 * @param  {Array<T>}    a     The first array
 * @param  {Array<T>}    b     The second array
 * @return {Array<T>}          Elements common to both the first and second array
 */
export function intersection<T>(a: T[], b: T[]): T[] {
  const test = new Set(a);
  const ref = new Set(b);

  return Array.from(test).filter((elem): elem is T => ref.has(elem));
}

/**
 * Computes the longest common subsequence for two arrays.
 * This function returns the elements from the two arrays
 * that form the LCS, in order of their appearance.
 *
 * @method lcs
 * @param  {Array<string>}    a     The first array
 * @param  {Array<string>}    b     The second array
 * @return {Array<string>}          The longest common subsequence between the first and second array
 */
export function lcs(a: string[], b: string[]): string[] {
  return lcsIndices(a, b).map((index) => b[index]);
}
