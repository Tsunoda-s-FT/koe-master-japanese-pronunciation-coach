
import React, { useState } from 'react';
import { AppLanguage, GeminiModel } from '../types';
import { UI_STRINGS } from '../constants';

interface SettingsProps {
  uiLang: AppLanguage;
  model: GeminiModel;
  onLangChange: (lang: AppLanguage) => void;
  onModelChange: (model: GeminiModel) => void;
}

export const Settings: React.FC<SettingsProps> = ({ uiLang, model, onLangChange, onModelChange }) => {
  const t = UI_STRINGS[uiLang];
  const [showModelSettings, setShowModelSettings] = useState(false);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Language:</span>
          <select 
            value={uiLang}
            onChange={(e) => onLangChange(e.target.value as AppLanguage)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ja">日本語 (JP)</option>
            <option value="en">English (EN)</option>
            <option value="zh">中文 (ZH)</option>
            <option value="ko">한국어 (KO)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowModelSettings(prev => !prev)}
          aria-expanded={showModelSettings}
          className="ml-auto flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11.983 1.357a1 1 0 00-1.966 0l-.125.757a6.978 6.978 0 00-1.62.674l-.699-.425a1 1 0 00-1.374.366l-.5.866a1 1 0 00.366 1.366l.68.414a7.02 7.02 0 000 1.36l-.68.414a1 1 0 00-.366 1.366l.5.866a1 1 0 001.374.366l.699-.425c.508.28 1.05.508 1.62.674l.125.757a1 1 0 001.966 0l.125-.757a6.978 6.978 0 001.62-.674l.699.425a1 1 0 001.374-.366l.5-.866a1 1 0 00-.366-1.366l-.68-.414a7.02 7.02 0 000-1.36l.68-.414a1 1 0 00.366-1.366l-.5-.866a1 1 0 00-1.374-.366l-.699.425a6.978 6.978 0 00-1.62-.674l-.125-.757zM10 7a3 3 0 110 6 3 3 0 010-6z" />
          </svg>
          {t.settings}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showModelSettings ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.7a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {showModelSettings && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">{t.model_label}:</span>
          <select 
            value={model}
            onChange={(e) => onModelChange(e.target.value as GeminiModel)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
            <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
          </select>
        </div>
      )}
    </div>
  );
};
