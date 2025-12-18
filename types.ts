
export enum Gender {
  MALE = 'Hombre',
  FEMALE = 'Mujer'
}

export enum AgeGroup {
  YOUNG = 'Joven',
  ADULT = 'Adulto',
  SENIOR = 'Mayor'
}

export enum VoiceStyle {
  NEUTRAL = 'Neutral',
  NARRATOR = 'Narrador Documental',
  STORYTELLER = 'Cuentacuentos',
  NEWS_ANCHOR = 'Noticias',
  WHISPER = 'Susurro',
  ENERGETIC = 'Energético'
}

export enum Mood {
  NEUTRAL = 'Calmado',
  HAPPY = 'Feliz',
  SAD = 'Triste',
  ANGRY = 'Enfadado',
  EXCITED = 'Emocionado',
  PROFESSIONAL = 'Profesional'
}

// Gemini specific voice names
export enum GeminiVoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export interface VoiceConfiguration {
  id: string;
  name: string;
  gender: Gender;
  age: AgeGroup;
  pitch: number; // 0.5 to 1.5
  speed: number; // 0.5 to 2.0
  stability: number; // 0.0 to 1.0 (Variability)
  intensity: number; // 0.0 to 1.0 (Soft vs Loud)
  style: VoiceStyle;
  mood: Mood;
  geminiVoice: GeminiVoiceName;
  isCloned: boolean;
}

export interface SavedVoice extends VoiceConfiguration {
  savedAt: number;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  audioBuffer: AudioBuffer;
  timestamp: Date;
  duration: number;
}

export interface EqualizerSettings {
  low: number;      // 60Hz
  midLow: number;   // 250Hz
  mid: number;      // 1kHz
  midHigh: number;  // 4kHz
  high: number;     // 12kHz
}

export interface PostProcessingSettings {
    playbackRate: number; // 0.5 to 2.0
    detune: number; // -1200 to 1200
}
