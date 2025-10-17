import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface EcardData {
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

export const generateEcardPdf = async (data: EcardData): Promise<string> => {
  
  const { name, role, backdropImageUrl, nameX, nameY, nameFontSize, nameColor, roleX, roleY, roleFontSize, roleColor } = data;

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

  // Add text overlay for name
  const nameElement = document.createElement('p');
  nameElement.innerText = name;
  nameElement.style.position = 'absolute';
  nameElement.style.left = `${nameX ?? 0}px`;
  nameElement.style.top = `${nameY ?? 0}px`;
  nameElement.style.fontSize = `${nameFontSize ?? 48}px`;
  nameElement.style.color = nameColor ?? '#000000';
  nameElement.style.fontFamily = 'Arial, sans-serif';
  nameElement.style.margin = '0';
  nameElement.style.fontWeight = 'bold';
  contentDiv.appendChild(nameElement);

  // Add text overlay for role
  const roleElement = document.createElement('p');
  roleElement.innerText = role;
  roleElement.style.position = 'absolute';
  roleElement.style.left = `${roleX ?? 0}px`;
  roleElement.style.top = `${roleY ?? 0}px`;
  roleElement.style.fontSize = `${roleFontSize ?? 36}px`;
  roleElement.style.color = roleColor ?? '#000000';
  roleElement.style.fontFamily = 'Arial, sans-serif';
  roleElement.style.margin = '0';
  contentDiv.appendChild(roleElement);

  document.body.appendChild(contentDiv);

  const canvas = await html2canvas(contentDiv, { scale: 2 });
  
  document.body.removeChild(contentDiv);

  const imgData = canvas.toDataURL('image/png');

  doc.addImage(imgData, 'PNG', 0, 0, 1200, 675);
  

  // Return the PDF as a base64 string
  const pdfDataUri = doc.output('datauristring');
  
  return pdfDataUri;
};