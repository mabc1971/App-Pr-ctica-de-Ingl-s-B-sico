
export enum SkillType {
  READING = 'Reading',
  LISTENING = 'Listening',
  SPEAKING = 'Speaking',
  WRITING = 'Writing',
  VOCABULARY = 'Vocabulary'
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  type: SkillType;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Exercise {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  hint: string;
}

export interface TranscriptionEntry {
  role: 'user' | 'model';
  text: string;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
