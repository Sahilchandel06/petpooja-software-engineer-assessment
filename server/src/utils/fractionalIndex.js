export const INDEX_GAP = 1000;
export const INDEX_EPSILON = 1e-6;

function assertFiniteIndex(value, name) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

export function getIndexBetween(previousIndex, nextIndex) {
  assertFiniteIndex(previousIndex, 'previousIndex');
  assertFiniteIndex(nextIndex, 'nextIndex');

  if (previousIndex >= nextIndex) {
    throw new RangeError('previousIndex must be smaller than nextIndex');
  }

  if (nextIndex - previousIndex <= INDEX_EPSILON) {
    throw new RangeError('The index gap is too small; rebalance before inserting');
  }

  return previousIndex + (nextIndex - previousIndex) / 2;
}

export function getStartIndex(nextIndex = null) {
  if (nextIndex === null) return INDEX_GAP;
  assertFiniteIndex(nextIndex, 'nextIndex');
  return nextIndex - INDEX_GAP;
}

export function getEndIndex(previousIndex = null) {
  if (previousIndex === null) return INDEX_GAP;
  assertFiniteIndex(previousIndex, 'previousIndex');
  return previousIndex + INDEX_GAP;
}

export function needsRebalance(previousIndex, nextIndex) {
  assertFiniteIndex(previousIndex, 'previousIndex');
  assertFiniteIndex(nextIndex, 'nextIndex');
  return nextIndex - previousIndex <= INDEX_EPSILON;
}

export function rebalanceIndexes(count, startAt = INDEX_GAP, gap = INDEX_GAP) {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer');
  }
  assertFiniteIndex(startAt, 'startAt');
  assertFiniteIndex(gap, 'gap');
  if (gap <= 0) throw new RangeError('gap must be positive');

  return Array.from({ length: count }, (_, index) => startAt + index * gap);
}
