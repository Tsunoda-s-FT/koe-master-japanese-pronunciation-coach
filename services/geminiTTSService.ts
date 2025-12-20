import { GoogleGenAI } from "@google/genai";
import { AppLanguage } from "../types";

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY || process.env.GEMINI_API_KEY : '');
};

// Map AppLanguage to ISO language codes for Gemini
const langToCode: Record<AppLanguage, string> = {
  ja: 'ja-JP',
  en: 'en-US',
  zh: 'zh-CN',
  ko: 'ko-KR'
};

/**
 * Generates high-quality speech audio from text using Gemini 2.0/2.5 models.
 * @param text The text to speak.
 * @param lang The language of the text.
 * @returns A Promise that resolves to a Blob of audio data.
 */
export const generateSpeech = async (text: string, lang: AppLanguage = 'ja'): Promise<Blob> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please set it in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      // @ts-ignore - systemInstruction is supported in v1beta but missing from SDK types
      systemInstruction: {
        parts: [{ text: "You are a text-to-speech engine. Your only goal is to generate audio from the provided text transcript. Do not generate any text output." }]
      },
      contents: [{ parts: [{ text }] }],
      config: {
        // @ts-ignore
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede'
            }
          },
          languageCode: langToCode[lang]
        }
      }
    });

    // Extract audio from the response candidate's parts
    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('audio/'));
    
    if (audioPart?.inlineData?.data) {
      const base64Data = audioPart.inlineData.data;
      const binaryString = atob(base64Data);
      const pcmData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
      }

      // Gemini 2.5 TTS returns raw PCM (L16, 24kHz, Mono)
      // Browsers need a WAV header to play this directly.
      const wavHeader = createWavHeader(pcmData.length, 24000);
      const wavData = new Uint8Array(wavHeader.length + pcmData.length);
      wavData.set(wavHeader, 0);
      wavData.set(pcmData, wavHeader.length);

      return new Blob([wavData], { type: 'audio/wav' });
    }

    throw new Error("Gemini response did not contain audio data.");
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};

/**
 * Creates a minimal WAV header for 16-bit PCM, 24kHz, Mono.
 */
function createWavHeader(dataLength: number, sampleRate: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // channel count (1 is mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * channelCount * bitsPerSample / 8)
  view.setUint32(28, sampleRate * 1 * 16 / 8, true);
  // block align (channelCount * bitsPerSample / 8)
  view.setUint16(32, 1 * 16 / 8, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  return new Uint8Array(header);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
