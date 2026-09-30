# Elapsed Time Estimator

Estimates remaining time for a task by computing a rolling average of durations over recently completed units.

## Usage

```js
import { ElapsedTimeEstimator } from 'elapsed-time-estimator';

const estimator = new ElapsedTimeEstimator(3); // average over last 3 intervals

estimator.mark(); // call once when the first unit completes
// ... do some work ...
estimator.mark(); // call again when the second unit completes

const remainingMs = estimator.estimate(10); // estimate time for 10 remaining units
console.log(`Estimated remaining time: ${remainingMs} ms`);
```

## Why this library exists

Many progress indicators extrapolate from total elapsed time and total completed units, which can be wildly inaccurate if the rate changes. This library instead keeps a rolling window of the most recent durations between completed units. That means it adapts to speed-ups or slow-downs, but it also means early estimates are noisy until the window fills. The trade-off is that you must decide the window size: a small window reacts quickly but is jittery; a large window is stable but slower to reflect changes.

## Awkward edge

Calling `estimate()` before at least two marks have been recorded throws an error, because there is no completed interval to measure. Use `sampleCount` to check whether enough data exists.

## API

- `new ElapsedTimeEstimator(windowSize, clock?)` — `windowSize` is a positive integer. The optional `clock` is a function returning milliseconds since epoch; it defaults to `Date.now` and is useful for testing.
- `mark(timestamp?)` — Records completion of one unit. The first call only sets the start time. Timestamps must be non-decreasing finite numbers.
- `estimate(remainingUnits)` — Returns estimated remaining milliseconds for a non-negative integer number of remaining units.
- `sampleCount` — Read-only number of completed intervals currently in the rolling window.
- `reset()` — Clears all recorded data.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

