export type AppLanguage = "ja" | "en" | "zh" | "ko";

export type PracticeMode = "text" | "free";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface Suggestion {
  word: string;
  romaji?: string;
  advice: string;
  translatedAdvice?: string;
}

export interface FeedbackData {
  score: number;
  overall_comment: string;
  pronunciation_feedback: string;
  intonation_feedback: string;
  suggestions: Suggestion[];
  transcription: string;
  translated_overall_comment?: string;
  translated_pronunciation_feedback?: string;
  translated_intonation_feedback?: string;
}

export interface AppState {
  uiLanguage: AppLanguage;
  practiceMode: PracticeMode;
  skillLevel: SkillLevel;
  targetText: string;
  audioBlob: Blob | null;
  isAnalyzing: boolean;
  isTranslating: boolean;
  translationLang: AppLanguage | null;
  feedback: FeedbackData | null;
  model: GeminiModel;
}
