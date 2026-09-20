import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ElapsedTimeEstimator } from '../src/index.js';

const fakeClock = (() => {
  let now = 0;
  return {
    next(ms) {
      now += ms;
      return now;
    },
    get() {
      return now;
    },
  };
})();

function makeEstimator(windowSize) {
  return new ElapsedTimeEstimator(windowSize, () => fakeClock.get());
}

test('constructor accepts positive integer window size', () => {
  const e = makeEstimator(3);
  assert.equal(e.sampleCount, 0);
});

test('constructor rejects invalid window size', () => {
  assert.throws(() => new ElapsedTimeEstimator(0), RangeError);
  assert.throws(() => new ElapsedTimeEstimator(1.5), RangeError);
  assert.throws(() => new ElapsedTimeEstimator(-1), RangeError);
});

test('first mark only records start timestamp', () => {
  const e = makeEstimator(3);
  e.mark(fakeClock.next(1000));
  assert.equal(e.sampleCount, 0);
});

test('second mark creates first duration sample', () => {
  const e = makeEstimator(3);
  fakeClock.next(1000);
  e.mark();
  fakeClock.next(500);
  e.mark();
  assert.equal(e.sampleCount, 1);
  assert.equal(e.estimate(1), 500);
});

test('rolling average uses only last windowSize intervals', () => {
  const e = makeEstimator(2);
  fakeClock.next(1000);
  e.mark();
  fakeClock.next(1000);
  e.mark(); // duration 1000
  fakeClock.next(400);
  e.mark(); // duration 400
  fakeClock.next(200);
  e.mark(); // duration 200
  assert.equal(e.sampleCount, 2);
  assert.equal(e.estimate(1), 300); // (400+200)/2
});

test('estimate scales linearly with remaining units', () => {
  const e = makeEstimator(2);
  fakeClock.next(1000);
  e.mark();
  fakeClock.next(1000);
  e.mark(); // duration 1000
  fakeClock.next(400);
  e.mark(); // duration 400
  assert.equal(e.estimate(3), 2100); // avg 700 * 3
});

test('estimate with zero remaining units returns zero', () => {
  const e = makeEstimator(2);
  fakeClock.next(1000);
  e.mark();
  fakeClock.next(1000);
  e.mark();
  assert.equal(e.estimate(0), 0);
});

test('estimate without samples throws', () => {
  const e = makeEstimator(2);
  assert.throws(() => e.estimate(1), /no completed units/);
});

test('estimate rejects negative remaining units', () => {
  const e = makeEstimator(2);
  fakeClock.next(1000);
  e.mark();
  fakeClock.next(1000);
  e.mark();
  assert.throws(() => e.estimate(-1), RangeError);
});

test('estimate rejects non-integer remaining units', () => {
  const e = makeEstimator(2);
  fakeClock.next(1000);
  e.mark();
  fakeClock.next(1000);
  e.mark();
  assert.throws(() => e.estimate(1.5), RangeError);
});

test('mark rejects non-finite timestamp', () => {
  const e = makeEstimator(2);
  assert.throws(() => e.mark(NaN), TypeError);
});

test('mark rejects decreasing timestamp', () => {
  const e = makeEstimator(2);
  fakeClock.next(2000);
  e.mark();
  assert.throws(() => e.mark(1999), RangeError);
});

test('reset clears samples and start timestamp', () => {
  const e = makeEstimator(2);
  fakeClock.next(1000);
  e.mark();
  fakeClock.next(1000);
  e.mark();
  e.reset();
  assert.equal(e.sampleCount, 0);
  assert.throws(() => e.estimate(1), /no completed units/);
  fakeClock.next(500);
  e.mark();
  assert.equal(e.sampleCount, 0);
});
