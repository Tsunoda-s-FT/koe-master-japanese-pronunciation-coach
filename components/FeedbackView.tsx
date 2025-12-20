import React from 'react';
import { FeedbackData, AppLanguage } from '../types';
import { UI_STRINGS } from '../constants';
import { useTTS } from '../hooks/useTTS';

interface FeedbackViewProps {
  data: FeedbackData;
  uiLang: AppLanguage;
  showTranslation?: boolean;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ data, uiLang, showTranslation }) => {
  const t = UI_STRINGS[uiLang];
  const translationEnabled = Boolean(showTranslation && uiLang !== 'ja');
  const { speak, isLoading: isSpeaking } = useTTS();

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Score Card */}
        <div className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 w-full md:w-48 ${getScoreColor(data.score)}`}>
          <span className="text-sm font-bold uppercase tracking-wider">{t.score_label}</span>
          <span className="text-6xl font-black">{data.score}</span>
        </div>

        {/* Overall Comment */}
        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
            {t.overall_section}
          </h3>
          <p className="text-slate-800 font-medium mb-3">{data.overall_comment}</p>
          {translationEnabled && data.translated_overall_comment && (
            <p className="text-slate-500 text-sm italic border-t border-slate-50 pt-2">
              {data.translated_overall_comment}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pronunciation & Intonation */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-700 mb-3">{t.pronunciation_section}</h4>
          <p className="text-slate-700 mb-3 leading-relaxed">{data.pronunciation_feedback}</p>
          {translationEnabled && data.translated_pronunciation_feedback && (
            <p className="text-slate-500 text-sm italic bg-slate-50 p-3 rounded-xl">
              {data.translated_pronunciation_feedback}
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-700 mb-3">{t.intonation_section}</h4>
          <p className="text-slate-700 mb-3 leading-relaxed">{data.intonation_feedback}</p>
          {translationEnabled && data.translated_intonation_feedback && (
            <p className="text-slate-500 text-sm italic bg-slate-50 p-3 rounded-xl">
              {data.translated_intonation_feedback}
            </p>
          )}
        </div>
      </div>

      {/* Transcription */}
      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
        <h4 className="font-bold text-indigo-900 mb-2">{t.transcription_label}</h4>
        <p className="text-lg text-indigo-900 font-medium font-japanese">「{data.transcription}」</p>
      </div>

      {/* Suggestions List */}
      {data.suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 px-2">{t.suggestions_section}</h3>
          <div className="grid grid-cols-1 gap-4">
            {data.suggestions.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start">
                <div className="bg-slate-100 px-3 py-1 rounded-lg text-indigo-600 font-bold text-lg min-w-[80px] text-center">
                  {item.word}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-800 font-bold">{item.word}</p>
                    <button
                      disabled={isSpeaking}
                      onClick={() => speak(item.word, 'ja')}
                      className="text-indigo-600 hover:text-indigo-700 p-1.5 rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50"
                      title={t.listen}
                    >
                      {isSpeaking ? (
                        <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.414 0A5.982 5.982 0 0115 10a5.982 5.982 0 01-1.757 4.243 1 1 0 01-1.414-1.414A3.982 3.982 0 0013 10a3.982 3.982 0 00-1.172-2.828a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-800 mb-1">{item.advice}</p>
                  {translationEnabled && item.translatedAdvice && (
                    <p className="text-slate-500 text-sm italic">{item.translatedAdvice}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
