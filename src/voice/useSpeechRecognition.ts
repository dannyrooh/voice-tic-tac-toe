import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal typings — the Web Speech API is not in TypeScript's DOM lib yet.
interface SpeechRecognitionAlternative { transcript: string }
interface SpeechRecognitionResult { isFinal: boolean; 0: SpeechRecognitionAlternative }
interface SpeechRecognitionEvent { resultIndex: number; results: ArrayLike<SpeechRecognitionResult> }
interface SpeechRecognitionErrorEvent { error: string }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getCtor = (): SpeechRecognitionCtor | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export interface SpeechRecognitionState {
  supported: boolean;
  listening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Continuous speech recognition. Calls `onFinal` with every final transcript.
 * Restarts automatically when the browser ends the session on silence.
 */
export function useSpeechRecognition(
  lang: string,
  onFinal: (transcript: string) => void,
): SpeechRecognitionState {
  const supported = getCtor() !== undefined;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.abort();
    recRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    recRef.current?.abort();

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinalRef.current(r[0].transcript);
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(e.error);
      wantRef.current = false;
    };
    rec.onend = () => {
      if (wantRef.current && recRef.current === rec) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      if (recRef.current === rec) {
        recRef.current = null;
        setListening(false);
      }
    };

    wantRef.current = true;
    recRef.current = rec;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      setError(String(err));
      wantRef.current = false;
      recRef.current = null;
    }
  }, [lang]);

  // Restart with the new language if it changes mid-session; clean up on unmount.
  useEffect(() => {
    if (wantRef.current) start();
  }, [start]);
  useEffect(() => stop, [stop]);

  return { supported, listening, error, start, stop };
}
