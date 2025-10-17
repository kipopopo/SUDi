import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface EcardData {
  name: string;
  role: string;
  backdropImageUrl: string;
}

export const generateEcardPdf = async (data: EcardData): Promise<Buffer> => {
  const { name, role, backdropImageUrl } = data;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1200, 675], // Standard e-card dimensions (e.g., 16:9 aspect ratio)
  });

  // Create a temporary div to render the content for html2canvas
  const contentDiv = document.createElement('div');
  contentDiv.style.width = '1200px';
  contentDiv.style.height = '675px';
  contentDiv.style.position = 'relative';
  contentDiv.style.overflow = 'hidden';

  // Add backdrop image
  const img = new Image();
  img.src = backdropImageUrl;
  img.style.position = 'absolute';
  img.style.top = '0';
  img.style.left = '0';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  contentDiv.appendChild(img);

  // Add text overlay for name and role
  const textOverlay = document.createElement('div');
  textOverlay.style.position = 'absolute';
  textOverlay.style.top = '50%';
  textOverlay.style.left = '50%';
  textOverlay.style.transform = 'translate(-50%, -50%)';
  textOverlay.style.textAlign = 'center';
  textOverlay.style.color = '#000000'; // Adjust text color as needed
  textOverlay.style.fontFamily = 'Arial, sans-serif'; // Adjust font as needed

  const nameElement = document.createElement('p');
  nameElement.style.fontSize = '48px'; // Adjust font size as needed
  nameElement.style.margin = '0';
  nameElement.style.fontWeight = 'bold';
  nameElement.innerText = name;
  textOverlay.appendChild(nameElement);

  const roleElement = document.createElement('p');
  roleElement.style.fontSize = '36px'; // Adjust font size as needed
  roleElement.style.margin = '0';
  roleElement.innerText = role;
  textOverlay.appendChild(roleElement);

  contentDiv.appendChild(textOverlay);

  document.body.appendChild(contentDiv);

  const canvas = await html2canvas(contentDiv, { scale: 2 });
  document.body.removeChild(contentDiv);

  const imgData = canvas.toDataURL('image/png');

  doc.addImage(imgData, 'PNG', 0, 0, 1200, 675);

  // Return the PDF as a Buffer
  return Buffer.from(doc.output('arraybuffer'));
};