let speakingUntil = 0;

/** True while the AI is talking (plus a short tail), so the mic can ignore its own voice. */
export const isAiSpeaking = (): boolean => Date.now() < speakingUntil;

export const ttsSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, lang: string): void {
  if (!ttsSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 1.05;
  const voice = synth.getVoices().find((v) => v.lang.replace('_', '-').startsWith(lang));
  if (voice) utter.voice = voice;

  // Rough upper bound until `onend` fires (≈ 70 ms per character).
  speakingUntil = Date.now() + 1500 + text.length * 70;
  utter.onend = utter.onerror = () => {
    speakingUntil = Date.now() + 600;
  };
  synth.speak(utter);
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
  speakingUntil = 0;
}
