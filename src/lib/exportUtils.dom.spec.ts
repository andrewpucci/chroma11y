/**
 * Export Utilities DOM Tests
 * Tests for browser-dependent functions (downloadFile, etc.)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile, downloadDesignTokens, downloadCSS, downloadSCSS } from './exportUtils';

describe('exportUtils DOM', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: HTMLAnchorElement;

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
      parentNode: document.body
    } as unknown as HTMLAnchorElement;

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadFile', () => {
    it('creates blob and triggers download', () => {
      expect.assertions(5);

      downloadFile('test content', 'test.txt', 'text/plain');

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:test-url');
      expect(mockLink.download).toBe('test.txt');
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });

    it('appends and removes link from body', () => {
      expect.assertions(2);

      downloadFile('test content', 'test.txt');

      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('revokes object URL after download', () => {
      expect.assertions(1);

      downloadFile('test content', 'test.txt');

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
    });

    it('uses default mime type text/plain', () => {
      expect.assertions(1);

      downloadFile('test content', 'test.txt');

      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('text/plain');
    });

    it('uses custom mime type when provided', () => {
      expect.assertions(1);

      downloadFile('{"test": true}', 'test.json', 'application/json');

      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('application/json');
    });

    it('throws error when createObjectURL fails', () => {
      expect.assertions(1);

      createObjectURLSpy.mockImplementation(() => {
        throw new Error('URL creation failed');
      });

      expect(() => downloadFile('test', 'test.txt')).toThrow('Failed to create object URL');
    });

    it('throws error when createElement fails', () => {
      expect.assertions(1);

      createElementSpy.mockImplementation(() => {
        throw new Error('Element creation failed');
      });

      expect(() => downloadFile('test', 'test.txt')).toThrow('Failed to trigger download');
    });

    it('cleans up even when click throws', () => {
      expect.assertions(2);

      mockLink.click = vi.fn(() => {
        throw new Error('Click failed');
      });

      expect(() => downloadFile('test', 'test.txt')).toThrow('Failed to trigger download');
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
    });
  });

  describe('downloadDesignTokens', () => {
    it('downloads JSON file with correct filename', () => {
      expect.assertions(2);

      const neutrals = ['#ffffff', '#000000'];
      const palettes = [['#ff0000', '#00ff00']];

      downloadDesignTokens(neutrals, palettes);

      expect(mockLink.download).toBe('color-tokens.json');
      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('application/json');
    });
  });

  describe('downloadCSS', () => {
    it('downloads CSS file with correct filename', () => {
      expect.assertions(2);

      const neutrals = ['#ffffff', '#000000'];
      const palettes = [['#ff0000', '#00ff00']];

      downloadCSS(neutrals, palettes);

      expect(mockLink.download).toBe('colors.css');
      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('text/css');
    });

    it('uses display values when provided', () => {
      expect.assertions(1);

      const neutrals = ['#ffffff'];
      const palettes: string[][] = [];
      const displayNeutrals = ['oklch(100% 0 0)'];

      downloadCSS(neutrals, palettes, displayNeutrals);

      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });
  });

  describe('downloadSCSS', () => {
    it('downloads SCSS file with correct filename', () => {
      expect.assertions(2);

      const neutrals = ['#ffffff', '#000000'];
      const palettes = [['#ff0000', '#00ff00']];

      downloadSCSS(neutrals, palettes);

      expect(mockLink.download).toBe('colors.scss');
      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('text/plain');
    });

    it('uses display values when provided', () => {
      expect.assertions(1);

      const neutrals = ['#ffffff'];
      const palettes: string[][] = [];
      const displayNeutrals = ['oklch(100% 0 0)'];
      const displayPalettes: string[][] = [];

      downloadSCSS(neutrals, palettes, displayNeutrals, displayPalettes);

      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });
  });
});
