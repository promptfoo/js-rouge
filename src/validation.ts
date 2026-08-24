/** Shared numeric contracts for the scorers and their public utilities. */
export function validateNGramSize(n: number): void {
  if (!Number.isSafeInteger(n) || n < 1) {
    throw new RangeError('ngram size must be a positive safe integer');
  }
}

export function validateMaxSkip(maxSkip: number): void {
  if (maxSkip !== Number.POSITIVE_INFINITY && (!Number.isInteger(maxSkip) || maxSkip < 0)) {
    throw new RangeError('maxSkip must be a non-negative integer or Infinity');
  }
}

export function validateBeta(beta: number): void {
  if (beta < 0 || (!Number.isFinite(beta) && beta !== Number.POSITIVE_INFINITY)) {
    throw new RangeError('beta must be a non-negative number or Infinity');
  }
}

const MAX_NGRAM_MATERIALIZATION_WORK = 1_000_000;

export function validateNGramMaterialization(
  tokens: string[],
  n: number,
  startPaddingSize = 0,
  endPaddingSize = 0,
  paddingValue = '',
): void {
  const paddingLength = startPaddingSize + endPaddingSize;
  const paddedLength = tokens.length + paddingLength;
  const gramCount = paddedLength - n + 1;
  let work = paddingLength + gramCount * (2 * n - 1);

  for (let index = 0; index < paddedLength && work <= MAX_NGRAM_MATERIALIZATION_WORK; index++) {
    const token =
      index < startPaddingSize || index >= startPaddingSize + tokens.length
        ? paddingValue
        : (tokens[index - startPaddingSize] ?? '');
    work += Math.max(token.length - 1, 0) * Math.min(index + 1, n, gramCount, paddedLength - index);
  }

  if (work > MAX_NGRAM_MATERIALIZATION_WORK) {
    throw new RangeError('N-gram generation exceeds the materialization limit');
  }
}
