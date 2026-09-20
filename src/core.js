export class ElapsedTimeEstimator {
  /**
   * @param {number} windowSize - Number of completed units to average over.
   * @param {() => number} [clock] - Optional clock returning milliseconds since epoch.
   */
  constructor(windowSize, clock = () => Date.now()) {
    if (!Number.isInteger(windowSize) || windowSize < 1) {
      throw new RangeError('windowSize must be a positive integer');
    }
    this.windowSize = windowSize;
    this.clock = clock;
    this._durations = [];
    this._lastTimestamp = null;
  }

  /**
   * Record completion of a unit.
   * @param {number} [timestamp] - Optional completion time. Defaults to clock().
   * @returns {void}
   */
  mark(timestamp = this.clock()) {
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
      throw new TypeError('timestamp must be a finite number');
    }
    if (this._lastTimestamp === null) {
      this._lastTimestamp = timestamp;
      return;
    }
    const duration = timestamp - this._lastTimestamp;
    if (duration < 0) {
      throw new RangeError('timestamps must be non-decreasing');
    }
    this._lastTimestamp = timestamp;
    this._durations.push(duration);
    if (this._durations.length > this.windowSize) {
      this._durations.shift();
    }
  }

  /**
   * Estimate remaining time for a given number of remaining units.
   * Uses the rolling average duration of completed units.
   * @param {number} remainingUnits - Number of units left to complete.
   * @returns {number} Estimated remaining time in milliseconds.
   */
  estimate(remainingUnits) {
    if (!Number.isInteger(remainingUnits) || remainingUnits < 0) {
      throw new RangeError('remainingUnits must be a non-negative integer');
    }
    if (remainingUnits === 0) {
      return 0;
    }
    if (this._durations.length === 0) {
      throw new Error('no completed units to estimate from');
    }
    const sum = this._durations.reduce((acc, d) => acc + d, 0);
    return (sum / this._durations.length) * remainingUnits;
  }

  /**
   * Number of completed intervals currently in the rolling average.
   * @returns {number}
   */
  get sampleCount() {
    return this._durations.length;
  }

  /**
   * Reset internal state, forgetting completed units and pending first timestamp.
   * @returns {void}
   */
  reset() {
    this._durations = [];
    this._lastTimestamp = null;
  }
}
