
import React from 'react';
import { FeedbackData, AppLanguage } from '../types';
import { UI_STRINGS } from '../constants';

interface FeedbackViewProps {
  data: FeedbackData;
  uiLang: AppLanguage;
  showTranslation?: boolean;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ data, uiLang, showTranslation }) => {
  const t = UI_STRINGS[uiLang];
  const translationEnabled = Boolean(showTranslation && uiLang !== 'ja');

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
