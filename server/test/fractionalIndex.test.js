import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getEndIndex,
  getIndexBetween,
  getStartIndex,
  needsRebalance,
  rebalanceIndexes,
} from '../src/utils/fractionalIndex.js';

test('fractional positions fit between neighbors and at either edge', () => {
  assert.equal(getIndexBetween(1000, 2000), 1500);
  assert.equal(getStartIndex(1000), 0);
  assert.equal(getEndIndex(1000), 2000);
  assert.equal(getStartIndex(), 1000);
  assert.equal(getEndIndex(), 1000);
});

test('small gaps signal rebalance and the helper produces spaced positions', () => {
  assert.equal(needsRebalance(1000, 1000 + 1e-7), true);
  assert.deepEqual(rebalanceIndexes(3), [1000, 2000, 3000]);
  assert.throws(() => getIndexBetween(2000, 1000), RangeError);
  assert.throws(() => rebalanceIndexes(-1), RangeError);
});
