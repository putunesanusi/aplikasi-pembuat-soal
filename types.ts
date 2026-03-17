export interface GlobalConfig {
  teacherName: string;
  institution: string;
  educationLevel: string;
  phase: string;
  grade: string;
  subject: string;
  topic: string;
}

export interface Question {
  no: number;
  pertanyaan: string;
  opsi?: string[];
  kunci: string;
  image_prompt?: string;
  image?: string | null;
  sectionTitle?: string;
  type?: string;
  originalSectionIndex?: number;
  originalQuestionIndex?: number;
}

export interface KisiKisi {
  no: number;
  materi: string;
  indikator: string;
  level: string;
}

export interface ExamPart {
  judul_bagian: string;
  tipe: string;
  customInstruction: string;
  soal: Question[];
  kisi_kisi: KisiKisi[];
}

export interface ExamData {
  ujian: ExamPart[];
}

export interface SectionConfig {
  id?: number;
  questionType: string;
  optionCount: string;
  withImage: boolean;
  difficulties: { [key: string]: boolean };
  difficultyCounts: { [key: string]: number };
  cognitiveLevels: { [key: string]: boolean };
  totalQuestions?: number;
  selectedCognitive?: string[];
  customInstruction?: string;
}
