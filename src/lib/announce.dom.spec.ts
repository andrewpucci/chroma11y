/**
 * Screen reader announcement utility tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { announce } from './announce';

describe('announce', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchEventSpy.mockRestore();
  });

  it('dispatches app:announce custom event with message', () => {
    expect.assertions(3);

    announce('Test announcement');

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('app:announce');
    expect(event.detail).toBe('Test announcement');
  });

  it('dispatches event with empty string message', () => {
    expect.assertions(2);

    announce('');

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toBe('');
  });
});
