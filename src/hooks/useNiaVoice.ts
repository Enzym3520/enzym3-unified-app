import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://ytembomoyhuwdtrzlwbi.supabase.co";

export function useNiaVoice() {
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
   
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in (window as any));

  const startListening = useCallback(
    (onTranscript: (text: string) => void) => {
      if (!speechSupported || isListening) return;

      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
       
      const recognition = new SpeechRecognitionAPI() as any;
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        if (transcript) onTranscript(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    },
    [speechSupported, isListening]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!voiceEnabled || !text) return;

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        setIsSpeaking(true);

        const res = await fetch(`${SUPABASE_URL}/functions/v1/nia-tts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error(`TTS error ${res.status}`);

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        console.error("[useNiaVoice] speak error:", err);
        setIsSpeaking(false);
      }
    },
    [voiceEnabled]
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    speechSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
