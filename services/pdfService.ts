import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface EcardData {
  name: string;
  role: string;
  backdropImageUrl: string;
}

// Helper function to apply styles to an element
const applyStyles = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
  for (const key in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      element.style[key as any] = styles[key]!;
    }
  }
};

export const generateEcardPdf = async (data: EcardData): Promise<Buffer> => {
  const { name, role, backdropImageUrl } = data;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1200, 675],
  });

  // Centralized styles
  const containerStyles: Partial<CSSStyleDeclaration> = {
    width: '1200px',
    height: '675px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    color: '#000000',
  };

  const imageStyles: Partial<CSSStyleDeclaration> = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const textOverlayStyles: Partial<CSSStyleDeclaration> = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  };

  const nameStyles: Partial<CSSStyleDeclaration> = {
    fontSize: '48px',
    margin: '0',
    fontWeight: 'bold',
  };

  const roleStyles: Partial<CSSStyleDeclaration> = {
    fontSize: '36px',
    margin: '0',
  };

  // Create and style elements
  const contentDiv = document.createElement('div');
  applyStyles(contentDiv, containerStyles);

  const img = new Image();
  img.crossOrigin = "anonymous"; // Handle CORS for images from other domains
  img.src = backdropImageUrl;
  applyStyles(img, imageStyles);
  contentDiv.appendChild(img);

  const textOverlay = document.createElement('div');
  applyStyles(textOverlay, textOverlayStyles);

  const nameElement = document.createElement('p');
  applyStyles(nameElement, nameStyles);
  nameElement.innerText = name;
  textOverlay.appendChild(nameElement);

  const roleElement = document.createElement('p');
  applyStyles(roleElement, roleStyles);
  roleElement.innerText = role;
  textOverlay.appendChild(roleElement);

  contentDiv.appendChild(textOverlay);

  // Append to body for rendering
  document.body.appendChild(contentDiv);

  // Use html2canvas to capture the content
  const canvas = await html2canvas(contentDiv, {
    scale: 2,
    backgroundColor: null, // Use a transparent background
    useCORS: true, // Needed for cross-origin images
  });

  // Clean up the temporary div
  document.body.removeChild(contentDiv);

  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', 0, 0, 1200, 675);

  return Buffer.from(doc.output('arraybuffer'));
};
