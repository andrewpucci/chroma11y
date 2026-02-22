/**
 * Color Utilities DOM Tests
 * Tests for browser-dependent functions (copyToClipboard)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './colorUtils';

describe('colorUtils DOM', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('copyToClipboard', () => {
    it('copies text to clipboard on success', async () => {
      expect.assertions(1);

      writeTextMock.mockResolvedValue(undefined);

      copyToClipboard('#ff0000');

      expect(writeTextMock).toHaveBeenCalledWith('#ff0000');
    });

    it('handles clipboard write failure gracefully', async () => {
      expect.assertions(1);

      writeTextMock.mockRejectedValue(new Error('Clipboard access denied'));

      // Should not throw
      copyToClipboard('#ff0000');

      expect(writeTextMock).toHaveBeenCalledWith('#ff0000');
    });
  });
});
