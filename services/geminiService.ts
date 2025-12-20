
import { GoogleGenAI, Type } from "@google/genai";
import { FeedbackData, PracticeMode, SkillLevel, GeminiModel, AppLanguage } from "../types";

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
};

const langMap: Record<AppLanguage, string> = {
  ja: "Japanese",
  en: "English",
  zh: "Chinese",
  ko: "Korean"
};

export const analyzePronunciation = async (
  audioBlob: Blob,
  mode: PracticeMode,
  level: SkillLevel,
  modelName: GeminiModel,
  targetText?: string
): Promise<FeedbackData> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY (or API_KEY) is missing. Set it in .env.local and restart the dev server.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const base64Audio = await blobToBase64(audioBlob);

  const isPro = modelName.includes('pro');

  const systemInstruction = `You are a world-class Japanese Pronunciation Coach (音声学者). 
    Your task is to analyze the audio of a non-native speaker and provide highly professional, encouraging, and actionable feedback.
    
    Target Level: ${level}
    Current Mode: ${mode === 'text' ? 'Practice for specific text: "' + targetText + '"' : 'Free speech / General conversation'}.
    
    Analysis Focus:
    1. Clarity of individual phonemes (mora sounds).
    2. Correct use of long vowels (長音), double consonants (促音), and n-sound (撥音).
    3. Pitch accent (高低アクセント) - Specify using standardized notation (e.g., H/L for high/low or number based type like 0/1/2/3).
    4. Naturalness of rhythm and speed.

    Scoring Guidance (align score with the learner's level):
    - Beginner: If grammar/vocabulary are correct and the message is clear, allow a high score (around 85-95) even with noticeable accent.
    - Intermediate: Balance pronunciation accuracy and naturalness; moderate accent should lower the score somewhat.
    - Advanced: 90+ only for near-native pronunciation, pitch accent, rhythm, and intonation. Otherwise score lower even if intelligible.

    Output Language:
    - Provide all feedback fields in Japanese only (translation is handled separately).
    - If the speaker is a beginner, focus on basic clarity. If advanced, focus on natural pitch and nuance.
    - For pitch accent feedback, use visual markers like 'H/L' or arrows where possible to make it intuitive.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/webm',
            data: base64Audio,
          },
        },
        { text: "Please analyze this Japanese speech audio based on the instructions provided." },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      // Use thinking budget for Pro models to get deeper analysis
      ...(isPro ? { thinkingConfig: { thinkingBudget: 4000 } } : {}),
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Score from 0 to 100 based on accuracy and naturalness." },
          overall_comment: { type: Type.STRING, description: "Summary of the speech quality in Japanese." },
          pronunciation_feedback: { type: Type.STRING, description: "Detailed phonetic advice in Japanese." },
          intonation_feedback: { type: Type.STRING, description: "Feedback on pitch and rhythm in Japanese." },
          transcription: { type: Type.STRING, description: "Full Japanese transcription of the audio." },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "The specific word or phrase analyzed." },
                romaji: { type: Type.STRING, description: "Romaji representation." },
                advice: { type: Type.STRING, description: "Correction advice in Japanese." }
              },
              required: ["word", "advice"]
            }
          }
        },
        required: [
          "score", "overall_comment",
          "pronunciation_feedback",
          "intonation_feedback",
          "transcription", "suggestions"
        ]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("JSON Parsing Error:", e, response.text);
    throw new Error("Failed to parse AI feedback format.");
  }
};

export const translateFeedback = async (
  feedback: FeedbackData,
  targetLanguage: AppLanguage,
  modelName: GeminiModel
): Promise<{
  translated_overall_comment: string;
  translated_pronunciation_feedback: string;
  translated_intonation_feedback: string;
  suggestions: { translatedAdvice: string }[];
}> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY (or API_KEY) is missing. Set it in .env.local and restart the dev server.");
  }
  if (targetLanguage === 'ja') {
    throw new Error("Translation target must be non-Japanese.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const sourcePayload = {
    overall_comment: feedback.overall_comment,
    pronunciation_feedback: feedback.pronunciation_feedback,
    intonation_feedback: feedback.intonation_feedback,
    suggestions: feedback.suggestions.map((item) => ({
      word: item.word,
      romaji: item.romaji,
      advice: item.advice
    }))
  };

  const systemInstruction = `You are a professional translator.
Translate the following Japanese feedback into ${langMap[targetLanguage]}.
Do not add or remove content. Keep the tone supportive and clear.
For suggestions, translate only the "advice" field and keep the array order.
Do NOT translate "word" or "romaji".`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [{ text: JSON.stringify(sourcePayload) }]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translated_overall_comment: { type: Type.STRING },
          translated_pronunciation_feedback: { type: Type.STRING },
          translated_intonation_feedback: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                translatedAdvice: { type: Type.STRING }
              },
              required: ["translatedAdvice"]
            }
          }
        },
        required: [
          "translated_overall_comment",
          "translated_pronunciation_feedback",
          "translated_intonation_feedback",
          "suggestions"
        ]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("JSON Parsing Error:", e, response.text);
    throw new Error("Failed to parse AI translation format.");
  }
};
