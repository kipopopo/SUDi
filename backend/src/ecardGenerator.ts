import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';

interface EcardPdfParams {
    name: string;
    role: string;
    backdropImageUrl: string;
    nameX?: number;
    nameY?: number;
    nameFontSize?: number;
    nameColor?: string;
    roleX?: number;
    roleY?: number;
    roleFontSize?: number;
    roleColor?: string;
}

// Helper to parse hex color to RGB
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
        }
        : { r: 0, g: 0, b: 0 };
};

export const generateEcardPdf = async (params: EcardPdfParams): Promise<string> => {
    const {
        name,
        role,
        backdropImageUrl,
        nameX = 0,
        nameY = 0,
        nameFontSize = 48,
        nameColor = '#000000',
        roleX = 0,
        roleY = 0,
        roleFontSize = 36,
        roleColor = '#000000',
    } = params;

    try {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Fetch and embed the backdrop image
        const imageBytes = await fetch(backdropImageUrl).then(res => res.arrayBuffer());
        const image = await pdfDoc.embedPng(imageBytes);
        
        // Add a page with the same dimensions as the image
        const page = pdfDoc.addPage([image.width, image.height]);
        
        // Draw the image on the page
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });

        // Draw the name
        const nameRgb = hexToRgb(nameColor);
        page.drawText(name, {
            x: nameX,
            y: page.getHeight() - nameY - nameFontSize, // Adjust Y coordinate
            font,
            size: nameFontSize,
            color: rgb(nameRgb.r, nameRgb.g, nameRgb.b),
        });

        // Draw the role
        const roleRgb = hexToRgb(roleColor);
        page.drawText(role, {
            x: roleX,
            y: page.getHeight() - roleY - roleFontSize, // Adjust Y coordinate
            font,
            size: roleFontSize,
            color: rgb(roleRgb.r, roleRgb.g, roleRgb.b),
        });

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes).toString('base64');

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate e-card PDF.');
    }
};
