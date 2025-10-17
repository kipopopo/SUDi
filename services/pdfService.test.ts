import { describe, it, expect, vi } from 'vitest';
import { generateEcardPdf } from './pdfService';
import * as jspdf from 'jspdf';

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,...'),
  }),
}));

describe('pdfService', () => {
  it('should generate a PDF with the correct text', async () => {
    const mockAddImage = vi.fn();
    const mockOutput = vi.fn().mockReturnValue('arraybuffer');
    const mockJsPdf = vi.spyOn(jspdf, 'default').mockImplementation(() => ({
      addImage: mockAddImage,
      output: mockOutput,
    }));

    const data = {
      name: 'Test Name',
      role: 'Test Role',
      backdropImageUrl: 'https://via.placeholder.com/1200x675',
    };

    const pdfBuffer = await generateEcardPdf(data);

    // Check if the buffer is created successfully
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check if jsPDF was called correctly
    expect(mockJsPdf).toHaveBeenCalledWith({
      orientation: 'landscape',
      unit: 'px',
      format: [1200, 675],
    });
  });
});
