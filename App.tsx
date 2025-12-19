
import React, { useState } from 'react';
import { AppState, AppLanguage, PracticeMode, SkillLevel, GeminiModel, FeedbackData } from './types';
import { UI_STRINGS } from './constants';
import { Settings } from './components/Settings';
import { AudioControls } from './components/AudioControls';
import { FeedbackView } from './components/FeedbackView';
import { analyzePronunciation, translateFeedback } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    uiLanguage: 'ja',
    practiceMode: 'free',
    skillLevel: 'beginner',
    targetText: '',
    audioBlob: null,
    isAnalyzing: false,
    isTranslating: false,
    translationLang: null,
    feedback: null,
    model: 'gemini-3-flash-preview',
  });
  const [audioResetSignal, setAudioResetSignal] = useState(0);

  const t = UI_STRINGS[state.uiLanguage];
  const isPro = state.model.includes('pro');

  const handleAnalyze = async () => {
    if (!state.audioBlob) return;
    
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      isTranslating: false,
      translationLang: null,
      feedback: null
    }));
    try {
      const result = await analyzePronunciation(
        state.audioBlob,
        state.practiceMode,
        state.skillLevel,
        state.model,
        state.targetText
      );
      setState(prev => ({ ...prev, feedback: result, isAnalyzing: false }));
    } catch (err: any) {
      console.error(err);
      alert(`Analysis failed: ${err.message || "Unknown error"}. Please check your connection or API key.`);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      audioBlob: null,
      feedback: null,
      isTranslating: false,
      translationLang: null
    }));
    setAudioResetSignal(prev => prev + 1);
  };

  const handleReanalyze = () => {
    if (!state.audioBlob || state.isAnalyzing) return;
    handleAnalyze();
  };

  const handleTranslate = async () => {
    if (!state.feedback || state.isTranslating || state.uiLanguage === 'ja') return;
    const targetLang = state.uiLanguage;

    setState(prev => ({ ...prev, isTranslating: true }));
    try {
      const result = await translateFeedback(state.feedback, targetLang, state.model);
      setState(prev => {
        if (!prev.feedback) {
          return { ...prev, isTranslating: false };
        }
        const mergedSuggestions = prev.feedback.suggestions.map((item, idx) => ({
          ...item,
          translatedAdvice: result.suggestions[idx]?.translatedAdvice || item.translatedAdvice
        }));
        return {
          ...prev,
          isTranslating: false,
          translationLang: targetLang,
          feedback: {
            ...prev.feedback,
            translated_overall_comment: result.translated_overall_comment,
            translated_pronunciation_feedback: result.translated_pronunciation_feedback,
            translated_intonation_feedback: result.translated_intonation_feedback,
            suggestions: mergedSuggestions
          }
        };
      });
    } catch (err: any) {
      console.error(err);
      alert(`Translation failed: ${err.message || "Unknown error"}. Please check your connection or API key.`);
      setState(prev => ({ ...prev, isTranslating: false }));
    }
  };

  const showTranslation = state.translationLang === state.uiLanguage && state.uiLanguage !== 'ja';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-slate-50">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-block bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2 shadow-sm">
            AI Language Learning
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            {t.title}
          </h1>
          <p className="text-slate-500 text-lg font-medium">{t.subtitle}</p>
        </header>

        {/* Top Controls */}
        <Settings 
          uiLang={state.uiLanguage} 
          model={state.model}
          onLangChange={(lang) => setState(prev => ({ ...prev, uiLanguage: lang }))}
          onModelChange={(model) => setState(prev => ({ ...prev, model }))}
        />

        {/* Practice Config */}
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block ml-1">Practice Mode</label>
              <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <button
                  onClick={() => setState(prev => ({ ...prev, practiceMode: 'free' }))}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${state.practiceMode === 'free' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t.mode_free}
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, practiceMode: 'text' }))}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${state.practiceMode === 'text' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t.mode_text}
                </button>
              </div>
            </div>

            {/* Level Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block ml-1">Proficiency Level</label>
              <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setState(prev => ({ ...prev, skillLevel: lv }))}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${state.skillLevel === lv ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {t[`level_${lv}`]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Target Text Input */}
          {state.practiceMode === 'text' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block ml-1">Script to practice</label>
              <textarea
                value={state.targetText}
                onChange={(e) => setState(prev => ({ ...prev, targetText: e.target.value }))}
                placeholder={t.placeholder_text}
                className="w-full min-h-[120px] p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-japanese text-xl leading-relaxed"
              />
            </div>
          )}

          {/* Audio Input Area */}
          <div className="space-y-6 pt-4 border-t border-slate-50">
            <AudioControls 
              uiLang={state.uiLanguage} 
              onAudioReady={(blob) => setState(prev => ({ ...prev, audioBlob: blob, feedback: null }))} 
              resetSignal={audioResetSignal}
            />
            
            {state.audioBlob && (
              <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300 pt-4">
                <button
                  disabled={state.isAnalyzing}
                  onClick={handleAnalyze}
                  className={`w-full max-w-sm px-12 py-5 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3`}
                >
                  {state.isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-sm font-bold opacity-80">{isPro ? 'AI is deep-thinking...' : 'Processing...'}</span>
                        <span className="text-xs font-medium opacity-60">Analyzing Pronunciation</span>
                      </div>
                    </>
                  ) : t.analyze_btn}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Area */}
        {state.feedback && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-4 gap-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.feedback_title}</h2>
              <div className="flex items-center gap-2">
                {state.uiLanguage !== 'ja' && (
                  <button
                    onClick={handleTranslate}
                    disabled={state.isAnalyzing || state.isTranslating}
                    className="text-slate-400 hover:text-indigo-600 font-bold transition-all flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-indigo-50 disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.5 2a1 1 0 011 1v1h3a1 1 0 110 2h-1.1a8.97 8.97 0 01-2.36 5.19l2.41 2.4a1 1 0 01-1.42 1.42l-2.5-2.5A9 9 0 0110 13a9.03 9.03 0 01-5.36-1.76l-.9.9a1 1 0 11-1.42-1.42l.97-.97A9 9 0 013.5 6H2a1 1 0 110-2h4V3a1 1 0 112 0v1h3.5V3a1 1 0 011-1zM6.1 6a7 7 0 003.9 5.15A7 7 0 0013.9 6H6.1z" />
                    </svg>
                    {state.isTranslating ? t.translating : t.translate_btn}
                  </button>
                )}
                <button
                  onClick={handleReanalyze}
                  disabled={state.isAnalyzing}
                  className="text-slate-400 hover:text-indigo-600 font-bold transition-all flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-indigo-50 disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a8 8 0 018 8 1 1 0 11-2 0 6 6 0 10-2.05 4.5H12a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0v-1.86A7.96 7.96 0 0110 18a8 8 0 110-16z" />
                  </svg>
                  {t.reanalyze}
                </button>
                <button
                  onClick={handleReset}
                  className="text-slate-400 hover:text-indigo-600 font-bold transition-all flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-indigo-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  {t.reset}
                </button>
              </div>
            </div>
            <FeedbackView data={state.feedback} uiLang={state.uiLanguage} showTranslation={showTranslation} />
          </div>
        )}

      </div>

      <footer className="mt-20 text-slate-400 text-sm pb-12 flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 font-medium">
          <span className="bg-slate-200 h-px w-8"></span>
          Koe-Master v1.1
          <span className="bg-slate-200 h-px w-8"></span>
        </div>
        <p className="opacity-60">Leveraging Gemini 3 Multimodal Intelligence</p>
      </footer>
    </div>
  );
};

export default App;
