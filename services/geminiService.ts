import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Participant } from '../types';
import { recordAiUsage } from './usageService';

// ================================================================
// NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
// ================================================================
// Google AI Studio automatically provides the `import.meta.env.VITE_API_KEY` when you
// run the application.
//
// For a production deployment, you must manage your API key securely:
// 1.  NEVER hardcode the API key directly in your frontend code.
// 2.  Store the API key as an environment variable on your hosting server
//     or in a secrets management service.
// 3.  Since this is client-side code, it's highly recommended to proxy
//     your Gemini API calls through your own backend server. This prevents
//     your API key from being exposed in the browser.
//
//     Your frontend would call your backend:
//     `fetch('/api/generate-email', { method: 'POST', body: JSON.stringify({ prompt }) })`
//
//     Your backend would then securely call the Gemini API using the key
//     stored on the server.
// ================================================================
if (!import.meta.env.VITE_API_KEY) {
  console.error("VITE_API_KEY environment variable not set.");
}

// Initialize the Google GenAI client with the API key.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });

/**
 * Generates an email body using the Gemini AI model based on a user-provided prompt and tone, streaming the response.
 * This includes "thinking" progress and the final text content.
 * @param {string} prompt - The user's prompt describing the desired email content.
 * @param {string} tone - The desired tone for the email (e.g., 'Professional', 'Casual').
 * @param {(chunk: GenerateContentResponse) => void} onChunk - A callback function to handle each streamed chunk of the response.
 * @returns {Promise<void>} A promise that resolves when the stream is complete.
 * @throws {Error} Throws an error if the AI content generation fails.
 */
export const generateEmailContentStream = async (prompt: string, tone: string, placeholders: string[], onChunk: (chunk: GenerateContentResponse) => void): Promise<void> => {
  recordAiUsage();
  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: `Sila jana kandungan emel yang menarik dalam Bahasa Malaysia dengan nada "${tone}", sesuai untuk demografi Malaysia, berdasarkan arahan berikut. Emel ini hendaklah sedia untuk dihantar. Jangan sertakan baris subjek. Anda boleh menggunakan placeholder berikut jika sesuai: ${placeholders.join(', ')}. Arahan: "${prompt}"`,
        config: {
            temperature: 0.7,
            topP: 1,
            topK: 1,
        }
    });

    for await (const chunk of response) {
      onChunk(chunk);
    }
  } catch (error) {
    console.error("Error generating email content:", error);
    throw new Error("Failed to generate content from AI. Please check your API key and network connection.");
  }
};


/**
 * Generates an email subject line using the Gemini AI model based on the template name and email body.
 * @param {string} templateName - The name of the email template.
 * @param {string} emailBody - The body of the email.
 * @returns {Promise<string>} A promise that resolves to the AI-generated subject line.
 * @throws {Error} Throws an error if the AI subject generation fails.
 */
export const generateEmailSubject = async (templateName: string, emailBody: string, placeholders: string[]): Promise<string> => {
  recordAiUsage();
  try {
    const prompt = `Sila jana baris subjek emel yang menarik dan ringkas dalam Bahasa Malaysia berdasarkan nama templat dan kandungan emel berikut. Pastikan ia sesuai untuk audiens di Malaysia. Berikan teks subjek sahaja, tanpa sebarang tanda petikan atau awalan seperti "Subjek:". Kandungan emel mungkin mengandungi placeholder seperti: ${placeholders.join(', ')}.

Nama Templat: "${templateName}"

Kandungan Emel:
${emailBody}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 1,
        topK: 1,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating email subject:", error);
    throw new Error("Failed to generate subject from AI.");
  }
};

/**
 * Analyzes a list of participants to suggest which ones are in senior roles and likely have a PA.
 * @param {Participant[]} participants - The list of participants to analyze.
 * @returns {Promise<Array<{id: string}>>} A promise that resolves to an array of objects with participant IDs.
 */
export const suggestPaEmailsForParticipants = async (participants: Participant[]): Promise<Array<{id: string}>> => {
  recordAiUsage();
  try {
    const participantData = participants.map(({ id, name, role }) => ({ id, name, role }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Berdasarkan senarai peserta berikut, kenal pasti individu yang memegang jawatan kanan atau eksekutif (seperti CEO, Naib Presiden, Pengarah, Pengurus) yang berkemungkinan mempunyai Pembantu Peribadi (PA).

      Senarai Peserta:
      ${JSON.stringify(participantData)}

      Kembalikan HANYA tatasusunan JSON yang mengandungi objek untuk peserta yang dikenal pasti. Setiap objek dalam tatasusunan mestilah mempunyai satu sifat sahaja: "id" (ID asal peserta). Jangan sertakan peserta yang tidak mungkin mempunyai PA.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
            },
            required: ['id'],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result;

  } catch (error) {
    console.error("Error suggesting PA emails:", error);
    throw new Error("Failed to get PA suggestions from AI. The model may have returned an invalid response.");
  }
};

/**
 * Improves a piece of text using the Gemini AI model.
 * @param {string} textToImprove - The text to be improved.
 * @returns {Promise<string>} A promise that resolves to the AI-improved text.
 * @throws {Error} Throws an error if the AI content generation fails.
 */
export const improveWriting = async (textToImprove: string): Promise<string> => {
  recordAiUsage();
  try {
    const prompt = `Please revise the following text to improve its clarity, tone, and professionalism for a business email, while preserving the core message. Return only the improved text.

Original Text:
"${textToImprove}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        topP: 1,
        topK: 1,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error improving writing:", error);
    throw new Error("Failed to improve text with AI.");
  }
};