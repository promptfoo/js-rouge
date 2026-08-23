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
