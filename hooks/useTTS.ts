import { useCallback, useState, useRef } from 'react';
import { generateSpeech } from '../services/geminiTTSService';
import { AppLanguage } from '../types';

export const useTTS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, lang: AppLanguage = 'ja') => {
    try {
      setIsLoading(true);
      
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const blob = await generateSpeech(text, lang);
      console.log("Generated TTS Blob:", blob.size, "bytes, type:", blob.type);
      
      const url = URL.createObjectURL(blob);
      console.log("Internal Audio URL:", url);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        console.log("TTS Playback Ended");
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      try {
        await audio.play();
        console.log("Audio playback started successfully");
      } catch (playError) {
        console.error("audio.play() failed:", playError);
        // Fallback or more info
        if (playError instanceof Error && playError.name === 'NotAllowedError') {
          console.warn("Audio playback blocked by browser policy. Interaction might be required.");
        }
      }
    } catch (error) {
      console.error("TTS Playback Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { speak, stop, isLoading };
};
