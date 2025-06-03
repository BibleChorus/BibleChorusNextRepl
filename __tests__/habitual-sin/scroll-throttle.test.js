/**
 * @jest-environment node
 */
const throttle = require('lodash.throttle');

jest.useFakeTimers();

describe('updateProgressThrottled', () => {
  test('limits calls to once per minute', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 60000);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(60000);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('flushes pending call immediately', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 60000);

    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    throttled.flush();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
