import { StorageService } from './storage';

export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
}

export class SpeechService {
  private static recognition: any = null;
  private static isListening: boolean = false;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  static startListening(
    onResult: (payload: SpeechRecognitionResultPayload) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    if (this.isListening) {
      this.stopListening();
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      onError('Moonshine Tiny STT: Speech recognition is not supported in this browser. Please type or use Chrome/Edge.');
      return false;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        onResult({
          transcript: finalTranscript || interimTranscript,
          isFinal: !!finalTranscript,
        });
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError(event.error ? `Speech error: ${event.error}` : 'Speech recognition failed.');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      this.isListening = false;
      onError(e?.message || 'Failed to initialize microphone.');
      return false;
    }
  }

  static stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }

  static getIsListening(): boolean {
    return this.isListening;
  }

  static speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    if (!this.synth) {
      if (onError) onError('Speech synthesis not available.');
      return;
    }

    // Stop ongoing speech
    this.synth.cancel();

    // Clean markdown syntax for smooth TTS audio reading
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    const settings = StorageService.getSettings();
    utterance.rate = settings.piperSpeechRate || 1.0;
    utterance.pitch = settings.piperPitch || 1.0;

    // Pick best natural voice available
    const voices = this.synth.getVoices();
    if (voices && voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Neural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel'))
      );
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      if (onError) onError(e);
    };

    this.synth.speak(utterance);
  }

  static stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  static isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}
