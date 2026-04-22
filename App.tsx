import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  BookOpen, Brain, Layers, List, Key, Table, 
  FileDown, CheckSquare, Circle, Sparkles, Image as ImageIcon, 
  Loader2, FlaskConical, Check, AlertTriangle, Wand2, Plus, Trash2, LayoutList,
  School, User, Building, Home, Settings, History, Menu, ChevronRight, ChevronDown, FileText, ArrowRight, PenTool, X, ArrowLeft, Zap, ShieldCheck, Clock, Crown, BarChart3, Lock, RefreshCw, HelpCircle, MousePointerClick, FileEdit, MonitorPlay, Gamepad2, Trophy, Play, SkipForward, RotateCcw, Repeat, ImagePlus, Edit3, Save
} from 'lucide-react';
import { GeminiService } from './services/geminiService';
import { GlobalConfig, ExamData, SectionConfig, Question } from './types';

const Sdn14Generator = () => {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<ExamData | null>(null);
  const [activeTab, setActiveTab] = useState('soal');
  
  // STATE KHUSUS UNTUK REGENERATE GAMBAR PER ITEM
  // Format key: "sectionIndex-questionIndex" -> value: boolean
  const [regeneratingIds, setRegeneratingIds] = useState<Record<string, boolean>>({});

  // STATE KHUSUS UNTUK REGENERATE TEXT SOAL PER ITEM (NEW)
  const [regeneratingQuestionIds, setRegeneratingQuestionIds] = useState<Record<string, boolean>>({});

  // STATE UNTUK EDIT PROMPT GAMBAR (NEW FEATURE)
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null); // Format: "sectionIdx-questionIdx"
  const [tempPromptValue, setTempPromptValue] = useState("");

  // STATE PROGRESS GAMBAR BACKGROUND (NEW)
  const [imageProgress, setImageProgress] = useState({
      active: false,
      current: 0,
      total: 0
  });

  // STATE NAVIGASI HALAMAN (Wizard Step)
  // Options: 'welcome', 'identity', 'technical', 'result', 'tutorial', 'quiz', 'legal'
  const [currentView, setCurrentView] = useState('welcome'); 
  
  // STATE MENU SIDEBAR (Collapsible)
  const [isTechnicalMenuOpen, setIsTechnicalMenuOpen] = useState(true);

  // STATE MOBILE MENU
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // STATE VALIDASI FORM (TEKNIS SOAL)
  const [formErrors, setFormErrors] = useState<any>({});

  // --- STATE MODAL CUSTOM INSTRUCTION (PER SECTION) ---
  const [isCustomInstrModalOpen, setIsCustomInstrModalOpen] = useState(false);
  const [tempCustomInstruction, setTempCustomInstruction] = useState("");

  useEffect(() => {
  if (isCustomInstrModalOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
  }, [isCustomInstrModalOpen]);

  // STATE VALIDASI FORM (IDENTITAS SOAL) - NEW
  const [identityErrors, setIdentityErrors] = useState<any>({});
  const [showRegisterInfo, setShowRegisterInfo] = useState(false);

  // --- STATE LOGIN (NEW) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- STATE KHUSUS MODE QUIZ ---
  const [quizMode, setQuizMode] = useState('edit'); // 'edit' | 'play' | 'score'
  const [quizState, setQuizState] = useState<{
    flatQuestions: Question[],
    currentIdx: number,
    score: number,
    selectedOptionIdx: number | null,
    isAnswered: boolean,
    showAnswer: boolean
  }>({
    flatQuestions: [],
    currentIdx: 0,
    score: 0, 
    selectedOptionIdx: null,
    isAnswered: false,
    showAnswer: false 
  });

  const resultRef = useRef<HTMLDivElement>(null);

  // 1. STATE GLOBAL (Berlaku untuk satu paket soal)
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    teacherName: '',
    institution: '',
    educationLevel: '', // SD, SMP, SMA
    phase: '',
    grade: '',
    subject: '',
    topic: '',
  });

  // Check if Identity is Complete
  const isIdentityComplete = 
    globalConfig.teacherName.trim() !== '' &&
    globalConfig.institution.trim() !== '' &&
    globalConfig.educationLevel !== '' &&
    globalConfig.phase !== '' &&
    globalConfig.grade !== '' &&
    globalConfig.subject.trim() !== '' &&
    globalConfig.topic.trim() !== '';

  // 2. STATE LIST BAGIAN SOAL (Keranjang Soal)
  const [sections, setSections] = useState<SectionConfig[]>([]);

  // 3. STATE FORM BUILDER (Untuk menambah bagian baru)
  const [currentSection, setCurrentSection] = useState<SectionConfig>({
    questionType: '', 
    optionCount: '4',
    withImage: false,
    difficulties: { Mudah: false, Sedang: false, Sulit: false },
    difficultyCounts: { Mudah: 0, Sedang: 0, Sulit: 0 },
    cognitiveLevels: { C1: false, C2: false, C3: false, C4: false, C5: false, C6: false }
  });

  // --- Data Referensi Hierarki Pendidikan ---
  const educationMap: any = {
    'SD/MI': {
      'Fase A': ['Kelas 1', 'Kelas 2'],
      'Fase B': ['Kelas 3', 'Kelas 4'],
      'Fase C': ['Kelas 5', 'Kelas 6']
    },
    'SMP/MTs': {
      'Fase D': ['Kelas 7', 'Kelas 8', 'Kelas 9']
    },
    'SMA/MA': {
      'Fase E': ['Kelas 10'],
      'Fase F': ['Kelas 11', 'Kelas 12']
    },
    'SMK': {
      'Fase E': ['Kelas 10'],
      'Fase F': ['Kelas 11', 'Kelas 12', 'Kelas 13']
    },
    'Kesetaraan': {
      'Paket A': ['Setara Kelas 1', 'Setara Kelas 2', 'Setara Kelas 3', 'Setara Kelas 4', 'Setara Kelas 5', 'Setara Kelas 6'],
      'Paket B': ['Setara Kelas 7', 'Setara Kelas 8', 'Setara Kelas 9'],
      'Paket C': ['Setara Kelas 10', 'Setara Kelas 11', 'Setara Kelas 12']
    },
    'SDLB': {
      'Fase A': ['Kelas 1', 'Kelas 2'],
      'Fase B': ['Kelas 3', 'Kelas 4'],
      'Fase C': ['Kelas 5', 'Kelas 6']
    },
    'SMPLB': {
      'Fase D': ['Kelas 7', 'Kelas 8', 'Kelas 9']
    },
    'SMALB': {
      'Fase E': ['Kelas 10'],
      'Fase F': ['Kelas 11', 'Kelas 12']
    }
  };

  const questionTypes = ['Pilihan Ganda', 'Pilihan Ganda Kompleks', 'Benar Salah', 'Isian Singkat', 'Uraian/Essai'];
  
  // Helper label jumlah opsi agar user tidak bingung (3=>ABC, 4=>ABCD, 5=>ABCDE)
  const optionCountLabel = (countStr: string) => {
    const n = Number(countStr) || 0;
    if (n <= 0) return "";
    return "ABCDE".slice(0, n);
  };

  const cognitiveLabels: any = {
    C1: 'Mengingat',
    C2: 'Memahami',
    C3: 'Menerapkan',
    C4: 'Menganalisis',
    C5: 'Mengevaluasi',
    C6: 'Mencipta'
  };

  const lotsLevels = ['C1', 'C2', 'C3'];
  const hotsLevels = ['C4', 'C5', 'C6'];

  // --- Handlers Global ---
  const handleGlobalChange = (field: string, value: string) => {
    setGlobalConfig(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (identityErrors[field]) {
        setIdentityErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  // Validasi Identitas
  const validateIdentity = () => {
      let errors: any = {};
      if (!globalConfig.teacherName.trim()) errors.teacherName = "Nama Guru harus diisi.";
      if (!globalConfig.institution.trim()) errors.institution = "Nama Institusi harus diisi.";
      if (!globalConfig.educationLevel) errors.educationLevel = "Pilih Jenjang Pendidikan.";
      if (!globalConfig.phase) errors.phase = "Pilih Fase.";
      if (!globalConfig.grade) errors.grade = "Pilih Kelas.";
      if (!globalConfig.subject.trim()) errors.subject = "Mata Pelajaran harus diisi.";
      if (!globalConfig.topic.trim()) errors.topic = "Topik Soal harus diisi.";
      
      return errors;
  };

  // Handle Next Button (Identity -> Technical)
  const handleNextToTechnical = () => {
  const errors = validateIdentity();
  if (Object.keys(errors).length > 0) {
    setIdentityErrors(errors);

    const firstErrorKey = Object.keys(errors)[0];
    // kasih jeda biar DOM sempet render state error dulu
    setTimeout(() => {
      const el = document.getElementById(`input-${firstErrorKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else {
        // fallback kalau id gak ketemu
        const mainContent = document.getElementById('main-content-scroll');
        if (mainContent) mainContent!.scrollTop = 0;
      }
    }, 50);

    return;
  }

  setIdentityErrors({});
  navigateTo('technical');
  };

  // Handler khusus untuk Jenjang (Reset Fase & Kelas)
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value;
    setGlobalConfig(prev => ({
      ...prev,
      educationLevel: newLevel,
      phase: '', // Reset Fase
      grade: ''  // Reset Kelas
    }));
    if (identityErrors.educationLevel) setIdentityErrors((prev: any) => ({ ...prev, educationLevel: null }));
  };

  // Handler khusus untuk Fase (Reset Kelas)
  const handlePhaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPhase = e.target.value;
    setGlobalConfig(prev => ({
      ...prev,
      phase: newPhase,
      grade: '' // Reset Kelas
    }));
    if (identityErrors.phase) setIdentityErrors((prev: any) => ({ ...prev, phase: null }));
  };

  // --- Handlers Section Builder ---
  const handleDiffCheck = (level: string) => {
    const isChecked = !currentSection.difficulties[level];
    setCurrentSection({
      ...currentSection,
      difficulties: { ...currentSection.difficulties, [level]: isChecked },
      difficultyCounts: { ...currentSection.difficultyCounts, [level]: isChecked ? 1 : 0 }
    });
    // Clear error if user interacts
    if (formErrors.difficulties) setFormErrors((prev: any) => ({...prev, difficulties: null}));
  };

  const handleDiffCountChange = (level: string, count: string) => {
    setCurrentSection({
      ...currentSection,
      difficultyCounts: { ...currentSection.difficultyCounts, [level]: parseInt(count) || 0 }
    });
  };

  const handleCogCheck = (level: string) => {
    setCurrentSection({
      ...currentSection,
      cognitiveLevels: { ...currentSection.cognitiveLevels, [level]: !currentSection.cognitiveLevels[level] }
    });
    // Clear error if user interacts
    if (formErrors.cognitive) setFormErrors((prev: any) => ({...prev, cognitive: null}));
  };

  const validateCurrentSection = () => {
  let newErrors: any = {};

  // 1. Bentuk Soal
  if (!currentSection.questionType) {
    newErrors.questionType = "Wajib memilih salah satu bentuk soal.";
  }

  // 2. Kesulitan & jumlah
  const selectedDiffs = Object.keys(currentSection.difficulties).filter(k => currentSection.difficulties[k]);
  const totalQ = selectedDiffs.reduce((acc, curr) => acc + currentSection.difficultyCounts[curr], 0);

  if (selectedDiffs.length === 0 || totalQ === 0) {
    newErrors.difficulties = "Pilih minimal satu tingkat kesulitan dan isi jumlah soalnya.";
  }

  // 3. Kognitif
  const selectedCogs = Object.keys(currentSection.cognitiveLevels).filter(k => currentSection.cognitiveLevels[k]);
  if (selectedCogs.length === 0) {
    newErrors.cognitive = "Pilih minimal satu target dimensi kognitif.";
  }

  return { newErrors, totalQ, selectedCogs };
  };

  // --- CRUD Sections ---
  const addSection = (customInstruction = "") => {
  let newErrors: any = {};

  if (!currentSection.questionType) {
    newErrors.questionType = "Wajib memilih salah satu bentuk soal.";
  }

  const selectedDiffs = Object.keys(currentSection.difficulties)
    .filter(k => currentSection.difficulties[k]);

  const totalQ = selectedDiffs.reduce(
    (acc, curr) => acc + (Number(currentSection.difficultyCounts[curr]) || 0),
    0
  );

  if (selectedDiffs.length === 0 || totalQ <= 0) {
    newErrors.difficulties = "Pilih minimal satu tingkat kesulitan dan isi jumlah soalnya.";
  }

  const selectedCogs = Object.keys(currentSection.cognitiveLevels)
    .filter(k => currentSection.cognitiveLevels[k]);

  if (selectedCogs.length === 0) {
    newErrors.cognitive = "Pilih minimal satu target dimensi kognitif.";
  }

  if (Object.keys(newErrors).length > 0) {
    setFormErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0];
    setTimeout(() => {
      const element = document.getElementById(`input-${firstErrorKey}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    return;
  }

  setFormErrors({});

  const newSection: SectionConfig = {
    id: Date.now(),
    ...currentSection,
    totalQuestions: totalQ,
    selectedCognitive: selectedCogs,
    customInstruction: (customInstruction || "").trim(),
  };

  setSections(prev => [...prev, newSection]);

  setCurrentSection({
    questionType: '',
    optionCount: '4',
    withImage: false,
    difficulties: { Mudah: false, Sedang: false, Sulit: false },
    difficultyCounts: { Mudah: 0, Sedang: 0, Sulit: 0 },
    cognitiveLevels: { C1: false, C2: false, C3: false, C4: false, C5: false, C6: false }
  });
  };


  const openCustomInstrModal = () => {
  const { newErrors } = validateCurrentSection();

  // Kalau ada error, JANGAN buka modal. Tampilkan error + scroll.
  if (Object.keys(newErrors).length > 0) {
    setFormErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0];
    setTimeout(() => {
      const element = document.getElementById(`input-${firstErrorKey}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    return;
  }

  // Kalau valid, baru buka modal
  setFormErrors({});
  setTempCustomInstruction("");
  setIsCustomInstrModalOpen(true);
  };

  const handleConfirmAddSection = (mode: string) => {
  // mode: 'skip' atau 'apply'
  const instr = mode === 'apply' ? tempCustomInstruction : "";
  addSection(instr);
  setIsCustomInstrModalOpen(false);
  setTempCustomInstruction("");
  };

  const removeSection = (id: number) => {
    setSections(sections.filter(s => s.id !== id));
  };

  // --- NAVIGATION HELPER ---
  const navigateTo = (viewName: string) => {
    // PROTEKSI LOGIN: Jika belum login, paksa ke login (kecuali welcome)
    if (viewName !== 'welcome' && !isLoggedIn) {
        setCurrentView('login');
        return;
    }

    // PROTEKSI SIDEBAR: Jika ingin ke technical/result/quiz tapi identity belum lengkap, tolak
    // KECUALI jika ingin ke 'tutorial' atau 'legal', itu boleh kapan saja
    if (viewName !== 'welcome' && viewName !== 'identity' && viewName !== 'tutorial' && viewName !== 'legal' && !isIdentityComplete) {
        // Force validate to show errors
        const errors = validateIdentity();
        setIdentityErrors(errors);
        setCurrentView('identity'); // Stay or go to identity
        // Scroll top
        setTimeout(() => {
            const mainContent = document.getElementById('main-content-scroll');
            if (mainContent) mainContent.scrollTop = 0;
        }, 10);
        return;
    }

    setCurrentView(viewName);
    setIsMobileMenuOpen(false); 
    // Reset Quiz Mode if navigating away and coming back? Maybe not to preserve state.
    if(viewName === 'quiz') {
      setQuizMode('edit'); // Always start in Edit mode
    }

    setTimeout(() => {
      const mainContent = document.getElementById('main-content-scroll');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    }, 10);
  };

  // --- IMAGEN GENERATION ---
  const generateImageWithImagen = async (prompt: string) => {
    return await GeminiService.generateImage(prompt);
  };

  // --- REGENERATE SINGLE IMAGE HANDLER ---
  const handleRegenerateImage = async (sectionIndex: number, questionIndex: number, prompt: string | undefined) => {
    if (!prompt) return;
    const uniqueId = `${sectionIndex}-${questionIndex}`;
    
    // 1. Set loading state for this specific image
    setRegeneratingIds(prev => ({ ...prev, [uniqueId]: true }));

    try {
        // 2. Call API
        const newImage = await generateImageWithImagen(prompt);

        if (newImage) {
            // 3. Update State with deep clone (Functional Update for Safety)
            setGeneratedData(prevData => {
                if (!prevData) return prevData;
                const newData = JSON.parse(JSON.stringify(prevData));
                if (newData.ujian[sectionIndex] && newData.ujian[sectionIndex].soal[questionIndex]) {
                    newData.ujian[sectionIndex].soal[questionIndex].image = newImage;
                }
                return newData;
            });
        } else {
             console.error("Gagal generate gambar");
        }
    } catch (error) {
        console.error("Error regenerating image:", error);
    } finally {
        // 4. Remove loading state
        setRegeneratingIds(prev => ({ ...prev, [uniqueId]: false }));
    }
  };

  // --- EDIT PROMPT HANDLERS (NEW) ---
  const handleStartEditPrompt = (sectionIndex: number, questionIndex: number, currentPrompt: string | undefined) => {
      const uniqueId = `${sectionIndex}-${questionIndex}`;
      setEditingPromptId(uniqueId);
      setTempPromptValue(currentPrompt || "");
  };

  const handleCancelEditPrompt = () => {
      setEditingPromptId(null);
      setTempPromptValue("");
  };

  const handleSaveAndRegeneratePrompt = async (sectionIndex: number, questionIndex: number) => {
      // 1. Update data lokal dengan prompt baru
      setGeneratedData(prevData => {
          if (!prevData) return prevData;
          const newData = JSON.parse(JSON.stringify(prevData));
          if (newData.ujian[sectionIndex] && newData.ujian[sectionIndex].soal[questionIndex]) {
              newData.ujian[sectionIndex].soal[questionIndex].image_prompt = tempPromptValue;
          }
          return newData;
      });

      // 2. Tutup mode edit
      setEditingPromptId(null);

      // 3. Trigger regenerasi gambar dengan prompt BARU
      await handleRegenerateImage(sectionIndex, questionIndex, tempPromptValue);
  };

  // --- DELETE IMAGE HANDLER ---
  const handleDeleteImage = (sectionIndex: number, questionIndex: number) => {
    setGeneratedData(prevData => {
        if (!prevData) return prevData;
        const newData = JSON.parse(JSON.stringify(prevData));
        if (newData.ujian[sectionIndex] && newData.ujian[sectionIndex].soal[questionIndex]) {
            newData.ujian[sectionIndex].soal[questionIndex].image = null;
        }
        return newData;
    });
  };

  // --- REGENERATE SINGLE QUESTION HANDLER (NEW) ---
  const handleRegenerateQuestion = async (sectionIndex: number, questionIndex: number) => {
    if (!generatedData) return;

    const uniqueId = `${sectionIndex}-${questionIndex}`;
    // Start TEXT Loading
    setRegeneratingQuestionIds(prev => ({ ...prev, [uniqueId]: true }));

    // Ambil Tipe Soal yang Sebenarnya dari data yang sudah di-generate
    const sectionType = generatedData.ujian[sectionIndex].tipe;
    const oldQuestion = generatedData.ujian[sectionIndex].soal[questionIndex];
    
    // Cek apakah ini Pilihan Ganda (Case Insensitive)
    const isMultipleChoice = sectionType.toLowerCase().includes('pilihan ganda');

    // DETEKSI JUMLAH OPSI LAMA (Agar konsisten 3, 4, atau 5 opsi)
    const currentOptionCount = oldQuestion.opsi ? oldQuestion.opsi.length : 5;
    const maxOptionChar = String.fromCharCode(64 + currentOptionCount); // misal 3 -> C

    // Deteksi konteks SLB untuk regenerate soal
    const isSpecialNeeds = globalConfig.educationLevel.includes('LB');
    const specialNeedsInstr = isSpecialNeeds 
        ? "KONTEKS KHUSUS SLB: Sesuaikan bahasa dan kesulitan untuk siswa berkebutuhan khusus. Gunakan kalimat sederhana dan jelas." 
        : "";

    // Deteksi konteks KESETARAAN untuk regenerate soal
    const isKesetaraan = globalConfig.educationLevel === 'Kesetaraan';
    const kesetaraanInstr = isKesetaraan
        ? "KONTEKS KESETARAAN: Soal untuk warga belajar (bukan siswa reguler). Gunakan bahasa jelas, ringkas, tidak kekanak-kanakan. Gunakan konteks kehidupan nyata. Hindari konteks yang terlalu anak sekolah kecuali relevan. Pastikan tingkat kesulitan sesuai paket dan kelas setara."
        : "";

    const sectionCustomInstr = generatedData?.ujian?.[sectionIndex]?.customInstruction || "";
    const customInstrText = sectionCustomInstr
        ? `CUSTOM INSTRUCTION (WAJIB DIIKUTI): ${sectionCustomInstr}`
        : "";

    const promptText = `
      Bertindaklah sebagai Guru Profesional.
      Buatlah SATU (1) butir soal pengganti yang BARU dan BERBEDA.
      
      KONTEKS:
      Jenjang: ${globalConfig.educationLevel} ${globalConfig.phase} Kelas ${globalConfig.grade}
      Mapel: ${globalConfig.subject}
      Topik: ${globalConfig.topic}
      Tipe Soal: ${sectionType}
      ${specialNeedsInstr}
      ${kesetaraanInstr}
      ${customInstrText}
      
      SOAL LAMA (JANGAN DIBUAT SAMA):
      "${oldQuestion.pertanyaan}"

      INSTRUKSI PENTING:
      1. Buat soal dengan topik yang sama tapi pertanyaan berbeda.
      2. Jika Tipe Soal mengandung kata "Pilihan Ganda" (termasuk "Pilihan Ganda Kompleks"), berikan TEPAT ${currentOptionCount} opsi jawaban baru (Array A-${maxOptionChar}).
      2b. Jika Tipe Soal adalah "Pilihan Ganda Kompleks", kunci jawaban WAJIB lebih dari satu (contoh: "A, C").
      3. Jika Tipe Soal adalah "Uraian" atau "Essai", array 'opsi' HARUS KOSONG []. JANGAN MEMBUAT OPSI.
      4. Format output harus JSON single object.
      5. Sertakan 'image_prompt' (bahasa inggris) untuk ilustrasi baru.
      6. Sertakan update 'kisi_kisi'.
      7. Format Kunci Jawaban WAJIB: "Huruf. Teks Jawaban Penuh" (Contoh: "A. Fotosintesis"). Jika Essai, langsung jawabannya.

      INSTRUKSI FORMAT MATEMATIKA (WAJIB PATUH):
      1. JANGAN GUNAKAN FORMAT LATEX (seperti $, $$, \\frac, \\sqrt, ^, _). Kode ini akan terlihat berantakan.
      2. Gunakan tag HTML <sup> untuk Pangkat. Contoh: 5<sup>2</sup> (bukan 5^2).
      3. Gunakan tag HTML <sub> untuk Indeks/Subscript. Contoh: H<sub>2</sub>O (bukan H_2O).
      4. Gunakan simbol Unicode biasa untuk:
         - Akar: √ (contoh: √25)
         - Kali: × (bukan *)
         - Bagi: ÷ atau :
         - Pecahan: Gunakan garis miring / (contoh: 1/2)
         - Derajat: ° (contoh: 45°)
         - Pi: π

      OUTPUT JSON:
      {
        "pertanyaan": "...",
        "opsi": ${isMultipleChoice ? '["Pilihan A", "Pilihan B", ...]' : '[]'},
        "kunci": "...",
        "image_prompt": "...",
        "kisi_kisi": {
            "materi": "...",
            "indikator": "...",
            "level": "..."
        }
      }
    `;

    try {
        const textRes = await GeminiService.generateText(promptText);
        const newQuestionData = parseAIResponse(textRes);

        // 1. UPDATE TEXT (SOAL & KISI-KISI)
        setGeneratedData(prevData => {
            if (!prevData) return prevData;
            const newData = JSON.parse(JSON.stringify(prevData));
            
            // Pastikan path ke soal ada
            if (newData.ujian[sectionIndex] && newData.ujian[sectionIndex].soal[questionIndex]) {
                const oldNo = newData.ujian[sectionIndex].soal[questionIndex].no;
                
                // A. Update Soal
                newData.ujian[sectionIndex].soal[questionIndex] = {
                    ...newQuestionData, // pertanyaan, opsi, kunci, image_prompt
                    no: oldNo,
                    image: null // Reset image lama
                };

                // B. Update Kisi-Kisi (Sinkronisasi Baru)
                // Cari index kisi-kisi yang nomornya sama dengan nomor soal
                if (newData.ujian[sectionIndex].kisi_kisi && Array.isArray(newData.ujian[sectionIndex].kisi_kisi)) {
                    const kisiIndex = newData.ujian[sectionIndex].kisi_kisi.findIndex((k: any) => k.no === oldNo);
                    
                    if (kisiIndex !== -1 && newQuestionData.kisi_kisi) {
                        newData.ujian[sectionIndex].kisi_kisi[kisiIndex] = {
                            ...newData.ujian[sectionIndex].kisi_kisi[kisiIndex], // retain 'no'
                            materi: newQuestionData.kisi_kisi.materi,
                            indikator: newQuestionData.kisi_kisi.indikator,
                            level: newQuestionData.kisi_kisi.level
                        };
                    }
                }
            }
            return newData;
        });

        // Hentikan loading teks agar user melihat perubahan soal
        setRegeneratingQuestionIds(prev => ({ ...prev, [uniqueId]: false }));

        // 2. OTOMATIS GENERATE GAMBAR (Jika ada prompt)
        if (newQuestionData.image_prompt) {
            // Start IMAGE Loading
            setRegeneratingIds(prev => ({ ...prev, [uniqueId]: true }));
            
            try {
                const newImage = await generateImageWithImagen(newQuestionData.image_prompt);
                
                if (newImage) {
                    setGeneratedData(prevData => {
                        const newData = JSON.parse(JSON.stringify(prevData));
                        if (newData.ujian[sectionIndex]?.soal[questionIndex]) {
                            newData.ujian[sectionIndex].soal[questionIndex].image = newImage;
                        }
                        return newData;
                    });
                }
            } catch (imgErr) {
                console.error("Auto-image generation failed:", imgErr);
            } finally {
                // Stop IMAGE Loading
                setRegeneratingIds(prev => ({ ...prev, [uniqueId]: false }));
            }
        }

    } catch (err) {
        console.error("Gagal regenerate soal:", err);
        // Pastikan loading mati jika error
        setRegeneratingQuestionIds(prev => ({ ...prev, [uniqueId]: false }));
        setRegeneratingIds(prev => ({ ...prev, [uniqueId]: false }));
    }
  };

  // --- HELPER UNTUK MEMBERSIHKAN OPSI JAWABAN (Fix Double Letters) ---
  const cleanOptionText = (text: string) => {
      return text.replace(/^[A-Ea-e][\.\)\s]\s*/, '');
  };

  // --- PARSER ---
  const parseAIResponse = (text: string) => {
    try {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstOpen = cleaned.indexOf('{');
      const lastClose = cleaned.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1) return JSON.parse(cleaned.substring(firstOpen, lastClose + 1));
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error("Gagal membaca struktur data. Coba generate ulang.");
    }
  };

  // --- HELPER BATCHING (NEW) ---
  const generateSectionBatch = async (sectionConfig: SectionConfig, startNo: number, count: number, totalInConfig: number, sectionIndex: number, batchIndex: number, totalBatches: number) => {
      const diffDetail = Object.keys(sectionConfig.difficulties)
          .filter(k => sectionConfig.difficulties[k])
          .map(d => `${d} (Proporsi Stok)`)
          .join(', ');

      let specificInstr = "";

        const isMC = sectionConfig.questionType.toLowerCase().includes('pilihan ganda');
        const optCount = parseInt(sectionConfig.optionCount || '4', 10);
        const maxChar = String.fromCharCode(64 + optCount); // 3->C, 4->D, 5->E

        if (isMC) {
        // WAJIB untuk PG & PG Kompleks: jumlah opsi harus tepat
        specificInstr += `WAJIB: Berikan TEPAT ${optCount} opsi jawaban, huruf A-${maxChar}. Array "opsi" harus panjangnya ${optCount}. `;
        }

        if (sectionConfig.questionType === 'Pilihan Ganda') {
        specificInstr += "Hanya 1 jawaban benar. ";
        }

        if (sectionConfig.questionType === 'Pilihan Ganda Kompleks') {
        specificInstr += "WAJIB: Kunci jawaban lebih dari satu (contoh: A, C). ";
        // Opsional tapi bagus: format kunci dipaksa konsisten
        specificInstr += 'Format kunci: "A, C" (huruf dipisah koma). ';
        }
      
      // LOGIC FIX: Kondisional instruksi gambar
      if (sectionConfig.withImage) {
        specificInstr += " Sertakan 'image_prompt' (English) untuk ilustrasi.";
      } else {
        specificInstr += " JANGAN sertakan ilustrasi atau image_prompt.";
      }

      // LOGIC FIX: Kondisional format JSON contoh agar AI tidak halusinasi
      const jsonItemExample = sectionConfig.withImage 
          ? `{ "no": ${startNo}, "pertanyaan": "...", "opsi": ["..."], "kunci": "...", "image_prompt": "..." }`
          : `{ "no": ${startNo}, "pertanyaan": "...", "opsi": ["..."], "kunci": "..." }`;

      // Deteksi konteks SLB untuk generate batch
      const isSpecialNeeds = globalConfig.educationLevel.includes('LB');
      const specialNeedsInstrBatch = isSpecialNeeds 
          ? "KONTEKS KHUSUS SLB: Sesuaikan bahasa dan kompleksitas untuk siswa Sekolah Luar Biasa (Berkebutuhan Khusus). Gunakan kalimat yang sangat sederhana, instruksi langsung, dan hindari ambiguitas. Materi harus adaptif." 
          : "";

      // Deteksi konteks KESETARAAN untuk generate batch
      const isKesetaraan = globalConfig.educationLevel === 'Kesetaraan';
      const kesetaraanInstrBatch = isKesetaraan
          ? "KONTEKS KESETARAAN: Soal ditujukan untuk warga belajar (remaja akhir/dewasa). Fokus pada kemampuan fungsional dan terapan. Gunakan skenario dunia nyata. Gunakan bahasa sederhana namun dewasa (hindari gaya anak kecil). Buat instruksi tegas dan tidak ambigu. Untuk Pilihan Ganda: distraktor masuk akal dan tepat 1 jawaban benar (kecuali PG Kompleks). Untuk kisi-kisi: indikator jelaskan kemampuan terapan yang diukur."
          : "";

      const promptText = `
        Bertindaklah sebagai Guru Profesional.
        Buatlah daftar soal untuk BAGIAN: ${sectionConfig.questionType}.
        
        KONTEKS:
        Jenjang: ${globalConfig.educationLevel} ${globalConfig.phase} Kelas ${globalConfig.grade}
        Mapel: ${globalConfig.subject}
        Topik: ${globalConfig.topic}
        ${specialNeedsInstrBatch}
        ${kesetaraanInstrBatch}
        ${sectionConfig.customInstruction ? `CUSTOM INSTRUCTION (WAJIB DIIKUTI): ${sectionConfig.customInstruction}` : ""}
        
        PARAMETER BATCH INI:
        - Buat sebanyak: ${count} butir soal.
        - Mulai penomoran dari no: ${startNo} sampai ${startNo + count - 1}.
        - Tingkat Kesulitan: ${diffDetail}
        - Kognitif: ${sectionConfig.selectedCognitive?.join(', ')}
        - Instruksi Khusus: ${specificInstr}

        INSTRUKSI FORMAT MATEMATIKA (WAJIB PATUH):
        1. JANGAN GUNAKAN FORMAT LATEX ($..$).
        2. Gunakan tag HTML <sup> untuk Pangkat, <sub> untuk Indeks.
        3. Gunakan simbol Unicode (√, ×, ÷, °, π).

        OUTPUT JSON (Hanya Object, Tanpa Markdown):
        {
          "soal_batch": [
             ${jsonItemExample}
          ],
          "kisi_batch": [
             { "no": ${startNo}, "materi": "...", "indikator": "...", "level": "..." }
          ]
        }

        PENTING:
        1. Pastikan jumlah item dalam array "soal_batch" dan "kisi_batch" TEPAT ${count} buah.
        2. Format Kunci: "Huruf. Jawaban" (PG) atau Jawaban langsung (Essai).
      `;

      const textRes = await GeminiService.generateText(promptText);
      let parsedResult = parseAIResponse(textRes);

      // --- VALIDASI JUMLAH OPSI (ANTI ABCD NGACO SAAT HARUS ABCDE) ---
      // pakai ulang isMC & optCount yang sudah didefinisikan di atas
      const expected = optCount;

      if (isMC && parsedResult?.soal_batch) {
        const badItems = parsedResult.soal_batch.filter((item: any) => {
          const len = Array.isArray(item.opsi) ? item.opsi.length : 0;
          return len !== expected;
        });

        if (badItems.length > 0) {
          throw new Error(`Batch invalid: ada soal dengan jumlah opsi tidak sama dengan ${expected}.`);
        }
      }

      // LOGIC FIX: Sanitasi Akhir (Hapus image_prompt jika AI bandel menyertakannya saat tidak diminta)
      if (!sectionConfig.withImage && parsedResult.soal_batch) {
          parsedResult.soal_batch = parsedResult.soal_batch.map((item: any) => {
              const { image_prompt, ...rest } = item;
              return rest;
          });
      }

      return parsedResult;
  };

  // --- BACKGROUND IMAGE PROCESSOR (REVISED FOR RETRY) ---
  const processBackgroundImages = async (examData: ExamData) => {
    // 1. Hitung total gambar yang BELUM ADA (Target Proses)
    let pendingImages = 0;
    examData.ujian.forEach(part => {
        part.soal.forEach(q => {
            if (q.image_prompt && !q.image) pendingImages++;
        });
    });

    if (pendingImages === 0) return;

    // 2. Set State Progress
    setImageProgress({ active: true, current: 0, total: pendingImages });

    let completed = 0;

    // 3. Loop untuk memproses gambar
    for (let i = 0; i < examData.ujian.length; i++) {
        for (let j = 0; j < examData.ujian[i].soal.length; j++) {
            const q = examData.ujian[i].soal[j];
            
            // Cek jika soal punya prompt tapi belum ada image
            if (q.image_prompt && !q.image) {
                try {
                    // Generate Gambar
                    const img = await generateImageWithImagen(q.image_prompt);
                    
                    if (img) {
                        // Update Data Utama secara Incremental
                        setGeneratedData(prev => {
                            if (!prev) return prev;
                            const newData = JSON.parse(JSON.stringify(prev));
                            
                            // Safety Check
                            if (newData.ujian[i] && newData.ujian[i].soal[j]) {
                                newData.ujian[i].soal[j].image = img;
                            }
                            return newData;
                        });
                    }
                } catch (e) {
                    console.error(`Bg image failed for ${i}-${j}`, e);
                } finally {
                    // Update Progress bar apapun yang terjadi (sukses/gagal)
                    completed++;
                    setImageProgress(prev => ({ ...prev, current: completed }));
                }
            }
        }
    }

    // 4. Selesai
    setImageProgress(prev => ({ ...prev, active: false }));
  };

  // --- HANDLER RETRY MANUAL ---
  const handleRetryFailedImages = () => {
    if (generatedData) {
        processBackgroundImages(generatedData);
    }
  };

  // --- HANDLER LOGIN (NEW) ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    // Simple check (can be replaced with API call later)
    // Default: admin / admin123
    const validUser = "admin";
    const validPass = "admin123";

    if (loginForm.username === validUser && loginForm.password === validPass) {
        setIsLoggedIn(true);
        setCurrentView('identity'); // Go to identity after login
    } else {
        setLoginError("Username atau Password salah. Silakan hubungi administrator.");
    }
  };

  // --- MAIN GENERATOR (REVISED) ---
  const generateExam = async () => {
    if (!isIdentityComplete) return setError("Lengkapi data Identitas Soal terlebih dahulu.");
    if (sections.length === 0) return setError("Tambahkan minimal satu bagian soal.");

    navigateTo('result');
    setLoading(true);
    setGeneratedData(null);
    setError(null);
    setRegeneratingIds({});
    setRegeneratingQuestionIds({});
    setImageProgress({ active: false, current: 0, total: 0 }); // Reset progress

    const BATCH_SIZE = 15; // Aman untuk menghindari timeout/cut-off
    let finalExamStructure: ExamData = { ujian: [] };

    try {
      // LOOP SETIAP BAGIAN (SECTION)
      for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const totalQ = section.totalQuestions || 0;
          
          let accumulatedSoal: any[] = [];
          let accumulatedKisi: any[] = [];

          // HITUNG BERAPA BATCH YANG DIBUTUHKAN
          const totalBatches = Math.ceil(totalQ / BATCH_SIZE);

          // LOOP SETIAP BATCH DALAM SECTION TERSEBUT
          for (let b = 0; b < totalBatches; b++) {
              const startNo = (b * BATCH_SIZE) + 1;
              // Hitung sisa soal. Jika sisa < batch size, gunakan sisa.
              const count = Math.min(BATCH_SIZE, totalQ - (b * BATCH_SIZE));
              
              setLoadingStatus(`Memproses Bagian ${i + 1} (${section.questionType})...\nBatch ${b + 1} dari ${totalBatches}`);

              // RETRY LOGIC SEDERHANA
              let attempts = 0;
              let success = false;
              while(attempts < 3 && !success) {
                  try {
                      const batchResult = await generateSectionBatch(section, startNo, count, totalQ, i, b, totalBatches);
                      if (batchResult.soal_batch && batchResult.kisi_batch) {
                          accumulatedSoal = [...accumulatedSoal, ...batchResult.soal_batch];
                          accumulatedKisi = [...accumulatedKisi, ...batchResult.kisi_batch];
                          success = true;
                      } else {
                          throw new Error("Format JSON Batch tidak valid");
                      }
                  } catch (err) {
                      attempts++;
                      console.warn(`Retry batch ${b+1} section ${i+1} attempt ${attempts}`);
                      if(attempts >= 3) throw err;
                      await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
                  }
              }
          }

          // GABUNGKAN HASIL BATCH MENJADI SATU BAGIAN UTUH
          finalExamStructure.ujian.push({
              judul_bagian: `Bagian ${i + 1}: ${section.questionType}`,
              tipe: section.questionType,
              customInstruction: section.customInstruction || "", // <--- TAMBAH INI
              soal: accumulatedSoal,
              kisi_kisi: accumulatedKisi
          });
      }

      // --- PERUBAHAN UTAMA: TAMPILKAN TEKS DULU, GAMBAR MENYUSUL ---
      // 1. Tampilkan data teks ke user
      setGeneratedData(finalExamStructure);
      
      // 2. Matikan loading utama
      setLoading(false);

      // 3. Jalankan proses gambar di background
      processBackgroundImages(finalExamStructure);

    } catch (err: any) {
      console.error(err);
      setError("Gagal: " + err.message + ". Coba kurangi jumlah soal atau coba lagi.");
      setLoading(false);
    }
  };

  // --- EXPORT WORD ---
  const handleExportWord = () => {
    if (!generatedData) return;

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>Soal - ${globalConfig.subject}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; }
        h1, h2, h3 { text-align: center; margin-bottom: 5px; margin-top: 10px; }
        .part-header { font-weight: bold; margin-top: 15px; border-bottom: 1px solid #000; text-transform: uppercase; margin-bottom: 10px; }
        .question { margin-bottom: 10px; page-break-inside: avoid; }
        
        /* Style Tabel Data (Kunci & Kisi-kisi) - Hemat Kertas */
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        table.data-table th, table.data-table td { 
            border: 1px solid #000000 !important; 
            padding: 2px 4px; /* Padding lebih kecil agar tidak boros kertas */
            text-align: left; 
            vertical-align: middle;
            line-height: 1.1; /* Jarak antar baris lebih rapat */
            font-size: 10pt; /* Font tabel sedikit diperkecil */
        }
        table.data-table th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
        
        /* Style Tabel Identitas (Tanpa Garis) */
        table.identity-table { width: 100%; border: none; margin-bottom: 15px; }
        table.identity-table td { border: none; padding: 2px; vertical-align: top; }

        sup { vertical-align: super; font-size: smaller; }
        sub { vertical-align: sub; font-size: smaller; }
      </style></head><body>
      
      <h1>NASKAH SOAL UJIAN</h1>
      
      <!-- Tabel Identitas -->
      <table class="identity-table">
        <tr>
          <td style="width:15%"><strong>Satuan Pendidikan</strong></td><td style="width:2%">:</td><td>${globalConfig.institution}</td>
          <td style="width:15%"><strong>Jenjang/Fase</strong></td><td style="width:2%">:</td><td>${globalConfig.educationLevel} / ${globalConfig.phase}</td>
        </tr>
        <tr>
          <td><strong>Mata Pelajaran</strong></td><td>:</td><td>${globalConfig.subject}</td>
          <td><strong>Kelas</strong></td><td>:</td><td>${globalConfig.grade}</td>
        </tr>
        <tr>
          <td><strong>Penyusun</strong></td><td>:</td><td>${globalConfig.teacherName}</td>
          <td></td><td></td><td></td>
        </tr>
      </table>
      <hr/>
    `;

    generatedData.ujian.forEach(part => {
        html += `<div class="part-header">${part.judul_bagian}</div>`;
        part.soal.forEach(q => {
            html += `<div class="question"><div><strong>${q.no}.</strong> ${q.pertanyaan}</div>`;
            
            if (q.image) html += `<div><img src="${q.image}" width="200" style="margin: 5px 0;" /></div>`;
            
            if (q.opsi && part.tipe.toLowerCase().includes('pilihan ganda')) {
                html += `<div style="margin-left:20px;">`;
                q.opsi.forEach((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const cleanOpt = opt.replace(/^[A-Ea-e][\.\)\s]\s*/, '');
                    const prefix = part.tipe.includes('Kompleks') ? '[ ]' : '';
                    html += `<div style="margin-bottom: 2px;"><strong>${letter}.</strong> ${prefix} ${cleanOpt}</div>`;
                });
                html += `</div>`;
            }
            html += `</div>`;
        });
    });

    html += `<br clear=all style='page-break-before:always'><h2>KUNCI JAWABAN</h2>`;
    generatedData.ujian.forEach(part => {
        // Tambahkan border="1" agar garis muncul di Word
        html += `<h3>${part.judul_bagian}</h3><table class="data-table" border="1" cellspacing="0" cellpadding="0"><thead><tr><th width="10%">No</th><th>Jawaban</th></tr></thead><tbody>`;
        part.soal.forEach(q => { html += `<tr><td align="center">${q.no}</td><td>${q.kunci}</td></tr>`; });
        html += `</tbody></table>`;
    });

    html += `<br clear=all style='page-break-before:always'><h2>KISI-KISI SOAL</h2>`;
    // Tambahkan border="1" agar garis muncul di Word
    html += `<table class="data-table" border="1" cellspacing="0" cellpadding="0"><thead><tr><th>Bagian</th><th>No</th><th>Materi</th><th>Indikator</th><th>Level</th></tr></thead><tbody>`;
    generatedData.ujian.forEach(part => {
        if(part.kisi_kisi) {
            part.kisi_kisi.forEach(row => {
                html += `<tr><td>${part.tipe}</td><td align="center">${row.no}</td><td>${row.materi}</td><td>${row.indikator}</td><td align="center">${row.level}</td></tr>`;
            });
        }
    });
    html += `</tbody></table></body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Soal_${globalConfig.subject.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- QUIZ GAME LOGIC ---
  const startQuiz = () => {
    // Flatten data for easy traversal
    let flatQ: Question[] = [];
    if(generatedData && generatedData.ujian) {
        generatedData.ujian.forEach((part, secIdx) => {
            if(part.soal) {
                part.soal.forEach((q, qIdx) => {
                    flatQ.push({
                        ...q,
                        sectionTitle: part.judul_bagian,
                        type: part.tipe,
                        originalSectionIndex: secIdx,
                        originalQuestionIndex: qIdx
                    });
                });
            }
        });
    }

    if (flatQ.length > 0) {
        setQuizState({
            flatQuestions: flatQ,
            currentIdx: 0,
            score: 0,
            selectedOptionIdx: null,
            isAnswered: false,
            showAnswer: false
        });
        setQuizMode('play');
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if(quizState.isAnswered) return;

    const currentQ = quizState.flatQuestions[quizState.currentIdx];
    // EXTRACTION LOGIC: Handles "A. Text", "A", or "A." robustly
    const correctKeyChar = currentQ.kunci.trim().charAt(0).toUpperCase(); 
    const selectedKey = String.fromCharCode(65 + optionIdx); // 0->A, 1->B

    const isCorrect = selectedKey === correctKeyChar;

    setQuizState(prev => ({
        ...prev,
        selectedOptionIdx: optionIdx,
        isAnswered: true,
        // Score calculation removed
        // score: isCorrect ? prev.score + 10 : prev.score 
    }));
  };

  const handleNextQuestion = () => {
      if(quizState.currentIdx < quizState.flatQuestions.length - 1) {
          setQuizState(prev => ({
              ...prev,
              currentIdx: prev.currentIdx + 1,
              selectedOptionIdx: null,
              isAnswered: false,
              showAnswer: false
          }));
      } else {
          setQuizMode('score');
      }
  };

  const createMarkup = (html: string) => ({ __html: html });

  // Helper untuk mendapatkan opsi Fase berdasarkan Jenjang
  const availablePhases = globalConfig.educationLevel ? Object.keys(educationMap[globalConfig.educationLevel] || {}) : [];
  
  // Helper untuk mendapatkan opsi Kelas berdasarkan Fase
  const availableGrades = (globalConfig.educationLevel && globalConfig.phase) 
      ? (educationMap[globalConfig.educationLevel][globalConfig.phase] || []) 
      : [];
    
  // --- LAYOUT HELPERS ---
  const isPlayMode = currentView === 'quiz' && quizMode === 'play';
  const showSidebar = currentView !== 'welcome' && !isPlayMode;

  // Count failed images
  const failedImageCount = generatedData?.ujian?.reduce((acc, part) => {
    return acc + (part.soal || []).filter(q => q.image_prompt && !q.image).length;
  }, 0) || 0;

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-slate-900">
      
      {isCustomInstrModalOpen && (
  <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 sm:items-center">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/60"
      onClick={() => setIsCustomInstrModalOpen(false)}
    />

    {/* Modal Card */}
    <div className="relative bg-white w-full max-w-2xl mx-4 rounded-sm shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
      <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between">
        <div className="text-white">
          <div className="text-sm font-bold uppercase tracking-wide">
            Custom Instruction (Opsional)
          </div>
          <div className="text-xs text-emerald-100 mt-1">
            Berlaku hanya untuk 1 struktur soal yang akan ditambahkan (misal: hanya PG saja).
          </div>
        </div>
        <button
          onClick={() => setIsCustomInstrModalOpen(false)}
          className="text-white/80 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1">
        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4 text-sm text-slate-700">
          <div className="font-bold text-slate-800 mb-1">Untuk apa kolom ini?</div>
          <div className="text-xs leading-relaxed text-slate-700">
            Kolom ini dipakai untuk memberi instruksi tambahan ke aplikasi agar soal sesuai kebutuhan guru.
            Instruksi ini hanya memengaruhi bagian/struktur yang sedang Anda tambahkan sekarang.
            Contoh: Anda membuat 2 struktur (Pilihan Ganda & Essai). Jika Anda isi instruction hanya saat menambah Pilihan Ganda,
            maka Essai tidak ikut berubah.

            Klik tombol SAYA TIDAK PAKAI INSTRUKSI jika Anda tidak ingin input instruksi!
          </div>

          <div className="mt-3 text-xs leading-relaxed">
            <div className="font-bold text-slate-800 mb-1">Contoh penggunaan:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Bahasa Inggris:</b> “Semua soal dan opsi jawaban wajib dalam Bahasa Inggris yang natural.”</li>
              <li><b>Bahasa Arab:</b> “Sertakan teks Arab (huruf Arab) pada pertanyaan, dan berikan terjemahan Indonesia singkat.”</li>
              <li><b>PAI:</b> “Sertakan potongan ayat Al-Qur’an atau hadits yang relevan dan singkat, lalu buat pertanyaan pemahaman.”</li>
              <li><b>Gaya penilaian:</b> “Buat soal lebih kontekstual dunia nyata dan hindari hafalan murni.”</li>
              <li><b>Format:</b> “Setiap soal harus menyertakan satu kalimat stimulus sebelum pertanyaan.”</li>
            </ul>

            <div className="mt-3 text-[10px] text-slate-500 italic">
              Catatan: untuk konten Arab/ayat/hadits, sebaiknya potongan singkat dan relevan. Guru tetap perlu verifikasi akurasi teks & makna.
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
            Tulis instruksi tambahan (opsional)
          </label>
          <textarea
            value={tempCustomInstruction}
            onChange={(e) => setTempCustomInstruction(e.target.value)}
            className="w-full border border-gray-300 bg-white text-slate-900 placeholder:text-gray-400 rounded-sm p-3 text-sm h-28 resize-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            placeholder='Ketik instruksi Anda di sini...'
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-end">
        <button
          onClick={() => handleConfirmAddSection('skip')}
          className="px-4 py-2 rounded-sm border border-gray-300 bg-white hover:bg-gray-100 text-slate-700 text-sm font-bold"
        >
          Saya tidak pakai instruksi
        </button>

        <button
          onClick={() => handleConfirmAddSection('apply')}
          className="px-4 py-2 rounded-sm bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Tambah dengan Instruksi
        </button>
      </div>
    </div>
  </div>
)}

      {/* --- FLOATING IMAGE PROGRESS INDICATOR (NEW) --- */}
      {imageProgress.active && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
              <div className="bg-white rounded-lg shadow-xl border border-blue-200 p-4 w-72 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <Loader2 size={16} className="text-emerald-600 animate-spin" />
                          <span className="text-sm font-bold text-slate-800">Memproses Gambar...</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {Math.round((imageProgress.current / imageProgress.total) * 100)}%
                      </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${(imageProgress.current / imageProgress.total) * 100}%` }}
                      ></div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-right">
                      Selesai {imageProgress.current} dari {imageProgress.total} ilustrasi
                  </div>
              </div>
          </div>
      )}

      {/* --- MOBILE OVERLAY BACKDROP --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      {showSidebar && (
      <aside className={`w-56 bg-white border-r border-gray-300 fixed h-full z-40 flex flex-col shadow-sm transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Header Sidebar - FORMAL STYLE */}
        <div className="h-16 flex items-center justify-between px-6 bg-emerald-800 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-sm">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none tracking-tight">Aplikasi Soal</h1>
              <p className="text-[9px] text-emerald-100 font-medium uppercase tracking-wider mt-0.5">Aplikasi Pembuat Soal</p>
            </div>
          </div>
          {/* Close Button for Mobile */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-white/80 hover:text-white">
             <X size={20} />
          </button>
        </div>
        
        {/* Status Bar */}
        <div className="bg-emerald-50 px-6 py-2 border-b border-emerald-100 flex items-center justify-between">
           <span className="text-[10px] font-bold text-emerald-800">Versi 1.2</span>
           <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-medium text-slate-600">Online</span>
           </div>
        </div>

        {/* Menu Sidebar */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          
          {/* GROUP: Buat Soal Baru */}
          <div className="px-4 py-2">
             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-2">Menu Utama</h3>
             <div className="space-y-0.5">
                {/* Menu: Identitas Soal */}
                <button 
                   onClick={() => navigateTo('identity')}
                   className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-4 ${currentView === 'identity' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-900'}`}
                >
                    <User size={16} className={`${currentView === 'identity' ? 'text-emerald-700' : 'text-slate-400'}`} />
                    Identitas Soal
                </button>

                {/* Menu: Teknis Soal (Collapsible) */}
                <div className={`${!isIdentityComplete ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <button 
                        onClick={() => navigateTo('technical')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors border-l-4 ${currentView === 'technical' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'border-transparent text-slate-600 hover:bg-gray-50'}`}
                        disabled={!isIdentityComplete}
                    >
                        <div className="flex items-center gap-3">
                            <Settings size={16} className={`${currentView === 'technical' ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <div className="flex items-center gap-2">
                                <span>Teknis Soal</span>
                                {!isIdentityComplete && <Lock size={12} className="text-slate-400" />}
                            </div>
                        </div>
                        {isTechnicalMenuOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                    </button>
                    
                    {/* Sub Menu */}
                    {isTechnicalMenuOpen && (
                        <div className="pl-9 space-y-1 mt-1 mb-2">
                            <button 
                                onClick={() => navigateTo('technical')}
                                disabled={!isIdentityComplete}
                                className={`w-full flex items-center gap-2 py-1.5 text-xs transition-colors text-left ${currentView === 'technical' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                <ChevronRight size={12} className={currentView === 'technical' ? 'text-emerald-700' : 'text-slate-400'} />
                                <span>Tambah Bagian</span>
                            </button>
                            <button 
                                onClick={() => navigateTo('technical')}
                                disabled={!isIdentityComplete}
                                className={`w-full flex items-center gap-2 py-1.5 text-xs transition-colors text-left ${currentView === 'technical' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                <ChevronRight size={12} className={currentView === 'technical' ? 'text-emerald-700' : 'text-slate-400'} />
                                <span>Struktur Paket</span>
                            </button>
                        </div>
                    )}
                </div>
             </div>
          </div>

          <div className="border-t border-gray-200 my-2 mx-4"></div>

          {/* GROUP: Output */}
          <div className="px-4 py-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-2">Laporan</h3>
                <button 
                    onClick={() => navigateTo('result')}
                    disabled={!isIdentityComplete}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-4 ${!isIdentityComplete ? 'opacity-50 cursor-not-allowed border-transparent text-slate-400' : currentView === 'result' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-900'}`}
                >
                    <FileDown size={16} className={`${currentView === 'result' ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <div className="flex items-center gap-2">
                        <span>Hasil Soal</span>
                        {!isIdentityComplete && <Lock size={12} className="text-slate-400" />}
                    </div>
                </button>
            {/* NEW MENU: MODE QUIZ */}
            <button 
                onClick={() => navigateTo('quiz')}
                disabled={!isIdentityComplete || !generatedData} // Disabled if no data
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-4 ${!isIdentityComplete || !generatedData ? 'opacity-50 cursor-not-allowed border-transparent text-slate-400' : currentView === 'quiz' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-900'}`}
            >
                <Gamepad2 size={16} className={`${currentView === 'quiz' ? 'text-emerald-700' : 'text-slate-400'}`} />
                <div className="flex items-center gap-2">
                    <span>Mode Quiz</span>
                    {(!isIdentityComplete || !generatedData) && <Lock size={12} className="text-slate-400" />}
                </div>
            </button>
          </div>

          <div className="border-t border-gray-200 my-2 mx-4"></div>

          {/* GROUP: Bantuan & Legal */}
          <div className="px-4 py-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-2">Informasi & Legal</h3>
            <button 
                onClick={() => navigateTo('tutorial')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-4 ${currentView === 'tutorial' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-900'}`}
            >
                <HelpCircle size={16} className={`${currentView === 'tutorial' ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>Tutorial</span>
            </button>
            <button 
                onClick={() => navigateTo('legal')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-4 ${currentView === 'legal' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-900'}`}
            >
                <ShieldCheck size={16} className={`${currentView === 'legal' ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>Ketentuan</span>
            </button>
          </div>

        </div>

        {/* User Profile - Formal Style */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-emerald-800 flex items-center justify-center text-white font-bold text-xs uppercase relative">
                  G
                  <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white">
                      <Crown size={8} className="text-emerald-900" fill="currentColor" />
                  </div>
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-bold text-slate-800 truncate">User: @guru97</p>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] text-slate-500 truncate">ID 598673</p>
                    
                 </div>
              </div>
           </div>
        </div>
      </aside>
      )}

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className={`flex-1 relative flex flex-col min-h-screen bg-gray-100 ${showSidebar ? 'md:ml-56' : ''}`}>
        
        {/* Mobile Header - Show only if NOT welcome screen */}
        {showSidebar && (
        <header className="bg-emerald-800 border-b border-emerald-900 p-4 md:hidden sticky top-0 z-30 flex items-center justify-between text-white shadow-md">
           <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1 rounded-sm"><PenTool className="w-4 h-4 text-white" /></div>
              <span className="font-bold tracking-tight">Aplikasi Soal Mobile</span>
           </div>
           {/* Mobile Menu Toggle Button */}
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white/80 hover:text-white p-1">
              <Menu size={24} />
           </button>
        </header>
        )}

        {/* Scrollable Content Area */}
        <main id="main-content-scroll" className={`flex-1 overflow-y-auto w-full ${currentView !== 'welcome' ? (isPlayMode ? 'p-0' : 'pb-24 md:pb-32 p-6 md:p-10 max-w-6xl mx-auto') : 'p-0'}`}>
          
          {/* --- VIEW 0: WELCOME SCREEN --- */}
          {currentView === 'welcome' && (
              <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-indigo-900 flex flex-col justify-center items-center p-6 text-white text-center">
                  <div className="max-w-3xl w-full animate-in fade-in zoom-in duration-700">
                      
                      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-sm">
                          Selamat Datang di <span className="text-yellow-300">Aplikasi Soal</span>
                      </h1>
                      <p className="text-lg md:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                          Aplikasi Pembuat Soal Otomatis. Solusi cerdas bagi pendidik Indonesia untuk menyusun naskah ujian dengan cepat, relevan dan efisien.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                          <div className="bg-white/5 p-5 rounded-xl border border-white/10 backdrop-blur-sm">
                              <h3 className="font-bold text-lg mb-1">Cepat & Efisien</h3>
                              <p className="text-sm text-emerald-100 opacity-80">Hasilkan puluhan soal lengkap dengan kunci jawaban dan kisi-kisi dalam hitungan menit.</p>
                          </div>
                          <div className="bg-white/5 p-5 rounded-xl border border-white/10 backdrop-blur-sm">
                              <h3 className="font-bold text-lg mb-1">Dukungan Materi</h3>
                              <p className="text-sm text-emerald-100 opacity-80">Mendukung level kognitif HOTS & LOTS serta materi yang relevan.</p>
                          </div>
                          <div className="bg-white/5 p-5 rounded-xl border border-white/10 backdrop-blur-sm">
                              <h3 className="font-bold text-lg mb-1">Ekspor Dokumen</h3>
                              <p className="text-sm text-emerald-100 opacity-80">Unduh hasil naskah soal langsung ke format Microsoft Word (.doc).</p>
                          </div>
                      </div>

                      <button 
                          onClick={() => navigateTo(isLoggedIn ? 'identity' : 'login')}
                          className="bg-yellow-400 hover:bg-yellow-300 text-emerald-900 font-extrabold py-4 px-10 rounded-full shadow-xl shadow-yellow-400/20 transform hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto text-lg"
                      >
                          {isLoggedIn ? 'Lanjutkan Buat Soal' : 'Buat Soal Sekarang'} <ArrowRight size={24} />
                      </button>

                      <button 
                          onClick={() => setShowRegisterInfo(!showRegisterInfo)}
                          className="mt-6 text-xs font-semibold text-emerald-300 hover:text-white transition-colors tracking-wide border-b border-transparent hover:border-white pb-0.5"
                      >
                          Daftar Akun Baru
                      </button>

                      {showRegisterInfo && (
                          <div className="mt-4 p-3 bg-white/10 border border-white/20 rounded-lg text-xs text-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300 max-w-xs mx-auto">
                              Pendaftaran pengguna baru dibatasi untuk institusi terdaftar. Silakan hubungi administrator sistem.
                          </div>
                      )}
                      
                  </div>
              </div>
          )}

          {/* --- VIEW: LOGIN (NEW) --- */}
          {currentView === 'login' && (
              <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6">
                  <div className="bg-white p-8 rounded-sm shadow-xl border border-gray-300 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col items-center mb-8">
                          <div className="bg-emerald-800 p-3 rounded-sm mb-4">
                              <Lock className="w-8 h-8 text-white" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Login Pengguna</h2>
                          <p className="text-slate-500 text-sm mt-1">Gunakan akun dari administrator</p>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-5">
                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Username</label>
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <User size={16} className="text-slate-400" />
                                  </div>
                                  <input 
                                      type="text" 
                                      required
                                      className="w-full pl-10 border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                      placeholder="Masukkan username"
                                      value={loginForm.username}
                                      onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                                  />
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Password</label>
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <Key size={16} className="text-slate-400" />
                                  </div>
                                  <input 
                                      type="password" 
                                      required
                                      className="w-full pl-10 border border-gray-300 rounded-sm p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                      placeholder="Masukkan password"
                                      value={loginForm.password}
                                      onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                                  />
                              </div>
                          </div>

                          {loginError && (
                              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-sm flex items-center gap-2 font-medium">
                                  <AlertTriangle size={14} /> {loginError}
                              </div>
                          )}

                          <button 
                              type="submit"
                              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-sm shadow-md transition-all flex items-center justify-center gap-2"
                          >
                              Masuk Sekarang <ArrowRight size={18} />
                          </button>
                      </form>

                      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                          <button 
                              onClick={() => navigateTo('welcome')}
                              className="text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center justify-center gap-1 mx-auto"
                          >
                              <ArrowLeft size={14} /> Kembali ke Beranda
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {currentView !== 'welcome' && !isPlayMode && (
          <div className="mb-6 pb-4 border-b border-gray-300">
            {/* Tombol Kembali (Muncul di Teknis & Tutorial) - DIHILANGKAN DARI LEGAL */}
            {(currentView === 'technical' || currentView === 'tutorial') && (
                <button 
                    onClick={() => navigateTo('identity')} 
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-800 mb-2 transition-colors uppercase tracking-wide group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Kembali
                </button>
            )}

            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
                {currentView === 'identity' && 'Data Identitas Soal'}
                {currentView === 'technical' && 'Konfigurasi Teknis Soal'}
                {currentView === 'result' && 'Pratinjau Hasil'}
                {currentView === 'tutorial' && 'Panduan Penggunaan'}
                {currentView === 'legal' && 'Syarat Ketentuan & Penafian'}
                {currentView === 'quiz' && 'Persiapan Kuis: Cek kelengkapan gambar dan konten sebelum bermain.'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
                {currentView === 'identity' && 'Silakan lengkapi form identitas di bawah ini dengan data yang valid.'}
                {currentView === 'technical' && 'Tentukan spesifikasi butir soal, tingkat kesulitan, dan dimensi kognitif.'}
                {currentView === 'result' && 'Unduh dokumen naskah soal dalam format Microsoft Word.'}
                {currentView === 'tutorial' && 'Pelajari langkah-langkah mudah menyusun soal otomatis.'}
                {currentView === 'legal' && 'Harap membaca ketentuan hukum terkait penggunaan teknologi AI dalam aplikasi ini.'}
                {currentView === 'quiz' && 'Mode Quiz Interaktif'}
            </p>
          </div>
          )}

          {/* --- VIEW: LEGAL DISCLAIMER --- */}
          {currentView === 'legal' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                 <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-300">
                     
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                         <div className="bg-yellow-100 p-2 rounded-full text-yellow-700">
                             <ShieldCheck size={32} />
                         </div>
                         <div>
                             <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Penafian & Batasan Tanggung Jawab</h3>
                             <p className="text-sm text-slate-500">Terakhir diperbarui: 27 Desember 2025</p>
                         </div>
                     </div>

                     <div className="space-y-6 text-slate-700 text-justify leading-relaxed text-sm font-serif">
                         
                         <p>
                             Dengan menggunakan aplikasi ini, Anda (selanjutnya disebut sebagai "Pengguna") dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang tercantum di bawah ini.
                         </p>

                         <div className="bg-slate-50 p-4 border-l-4 border-emerald-800 rounded-r-sm">
                             <h4 className="font-bold text-emerald-900 mb-2 uppercase text-xs tracking-wider">Pasal 1: Penggunaan Teknologi Kecerdasan Buatan (AI)</h4>
                             <p className="text-sm">
                                 Layanan ini menggunakan teknologi <em>Large Language Model</em> (Generative AI) pihak ketiga untuk menghasilkan konten teks (soal, jawaban, kisi-kisi) dan ilustrasi gambar secara otomatis. Seluruh output yang dihasilkan adalah prediksi probabilistik dari sistem komputer dan bukan hasil pemikiran manusia secara langsung.
                             </p>
                         </div>

                         <div>
                             <h4 className="font-bold text-slate-900 mb-2">Pasal 2: Akurasi dan Validitas Konten</h4>
                             <p>
                                 Pengembang tidak memberikan jaminan, baik secara tersurat maupun tersirat, mengenai keakuratan, kebenaran, keandalan, atau kesesuaian materi soal, kunci jawaban, dan ilustrasi yang dihasilkan oleh sistem. Kesalahan faktual, bias algoritmik, atau "halusinasi" data (informasi yang tampak benar namun keliru) dapat terjadi sewaktu-waktu.
                             </p>
                         </div>

                         <div>
                             <h4 className="font-bold text-slate-900 mb-2">Pasal 3: Kewajiban Verifikasi Pengguna (Human-in-the-Loop)</h4>
                             <p>
                                 Pengguna (Guru/Pendidik) memegang kendali penuh dan tanggung jawab mutlak atas penggunaan output aplikasi ini. Pengguna <strong>DIWAJIBKAN</strong> untuk:
                             </p>
                             <ul className="list-disc pl-5 mt-2 space-y-1">
                                 <li>Menelaah, memverifikasi, dan menyunting setiap butir soal dan kunci jawaban sebelum digunakan.</li>
                                 <li>Memastikan materi sesuai dengan kurikulum, norma sosial, etika, dan nilai-nilai pendidikan yang berlaku di Indonesia.</li>
                                 <li>Memeriksa ilustrasi gambar agar tidak mengandung unsur SARA, pornografi, atau konten yang tidak pantas bagi peserta didik.</li>
                             </ul>
                         </div>

                         <div>
                             <h4 className="font-bold text-slate-900 mb-2">Pasal 4: Batasan Tanggung Jawab Hukum</h4>
                             <p>
                                 Pengembang aplikasi, penyedia layanan AI, dan afiliasinya <strong>TIDAK BERTANGGUNG JAWAB</strong> atas segala bentuk kerugian, tuntutan hukum, atau dampak negatif yang timbul, baik secara langsung maupun tidak langsung, akibat penggunaan soal ujian yang dihasilkan oleh aplikasi ini tanpa melalui proses verifikasi yang layak oleh Pengguna. Segala konsekuensi akademis maupun hukum yang terjadi di lingkungan satuan pendidikan menjadi tanggung jawab penuh Pengguna.
                             </p>
                         </div>

                         <div>
                             <h4 className="font-bold text-slate-900 mb-2">Pasal 5: Hak Kekayaan Intelektual</h4>
                             <p>
                                 Hasil luaran (output) soal yang telah disunting dan diunduh menjadi milik Pengguna sepenuhnya. Namun, Pengguna dilarang menggunakan aplikasi ini untuk menghasilkan konten yang melanggar hak cipta pihak ketiga atau hukum yang berlaku di Negara Kesatuan Republik Indonesia.
                             </p>
                         </div>

                         <div className="border-t border-gray-200 pt-6 mt-8 text-center">
                             <p className="font-bold text-slate-500 text-xs uppercase mb-4">
                                 Dengan melanjutkan, Anda menyatakan telah memahami dan menerima ketentuan ini.
                             </p>
                             <button
                                 onClick={() => navigateTo('identity')}
                                 className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-12 rounded-full shadow-lg transition-transform transform hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
                             >
                                 <Check size={20} /> Saya Setuju
                             </button>
                         </div>

                     </div>
                 </div>
             </div>
          )}

          {/* --- VIEW: TUTORIAL PENGGUNAAN --- */}
          {currentView === 'tutorial' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                 
                 {/* Step 1 */}
                 <div className="flex gap-6">
                    <div className="flex-shrink-0">
                       <div className="w-12 h-12 bg-emerald-800 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-emerald-50">1</div>
                    </div>
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex-1 relative">
                       <div className="absolute top-4 right-4 text-emerald-100"><User size={48} /></div>
                       <h3 className="text-lg font-bold text-slate-800 mb-2">Lengkapi Identitas</h3>
                       <p className="text-sm text-slate-600 leading-relaxed">
                          Langkah pertama adalah mengisi form identitas. Pastikan Anda memilih <strong>Jenjang, Fase, dan Kelas</strong> yang sesuai agar materi soal relevan. 
                          Deskripsikan <strong>Topik / Lingkup Materi</strong> sedetail mungkin untuk hasil yang lebih akurat.
                       </p>
                    </div>
                 </div>

                 {/* Step 2 */}
                 <div className="flex gap-6">
                    <div className="flex-shrink-0">
                       <div className="w-12 h-12 bg-emerald-800 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-emerald-50">2</div>
                    </div>
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex-1 relative">
                       <div className="absolute top-4 right-4 text-emerald-100"><Settings size={48} /></div>
                       <h3 className="text-lg font-bold text-slate-800 mb-2">Konfigurasi Teknis Soal</h3>
                       <p className="text-sm text-slate-600 leading-relaxed mb-3">
                          Pada menu <strong>Teknis Soal</strong>, Anda dapat merancang struktur ujian. Anda bisa menambahkan banyak bagian dengan tipe soal berbeda dalam satu paket.
                       </p>
                       <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
                          <li>Pilih <strong>Bentuk Soal</strong> (PG, Isian, Uraian, dll).</li>
                          <li>Aktifkan opsi <strong>Gambar</strong> jika ingin AI membuat ilustrasi soal.</li>
                          <li>Tentukan distribusi <strong>Kesulitan</strong> (Mudah, Sedang, Sulit).</li>
                          <li>Pilih target <strong>Dimensi Kognitif</strong> (C1-C6).</li>
                       </ul>
                    </div>
                 </div>

                 {/* Step 3 */}
                 <div className="flex gap-6">
                    <div className="flex-shrink-0">
                       <div className="w-12 h-12 bg-emerald-800 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-emerald-50">3</div>
                    </div>
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex-1 relative">
                       <div className="absolute top-4 right-4 text-emerald-100"><Wand2 size={48} /></div>
                       <h3 className="text-lg font-bold text-slate-800 mb-2">Generate Soal Otomatis</h3>
                       <p className="text-sm text-slate-600 leading-relaxed">
                          Setelah struktur paket soal terbentuk di panel kanan, klik tombol hijau <strong>"Buat Naskah Soal"</strong>. 
                          AI akan bekerja menyusun soal, kunci jawaban, dan kisi-kisi sekaligus. Proses ini memakan waktu beberapa menit tergantung jumlah soal.
                       </p>
                    </div>
                 </div>

                 {/* Step 4 */}
                 <div className="flex gap-6">
                    <div className="flex-shrink-0">
                       <div className="w-12 h-12 bg-emerald-800 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-emerald-50">4</div>
                    </div>
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex-1 relative">
                       <div className="absolute top-4 right-4 text-emerald-100"><FileEdit size={48} /></div>
                       <h3 className="text-lg font-bold text-slate-800 mb-2">Review & Manajemen Gambar</h3>
                       <p className="text-sm text-slate-600 leading-relaxed">
                          Periksa hasil soal di halaman Pratinjau. Anda memiliki kendali penuh terhadap ilustrasi: gunakan tombol <strong>"Buat Ulang Gambar"</strong> untuk mendapatkan variasi baru atau tombol <strong>"Hapus Gambar"</strong> jika ilustrasi tidak diperlukan.
                       </p>
                    </div>
                 </div>

                 {/* Step 5 (NEW: Quiz Mode) */}
                 <div className="flex gap-6">
                    <div className="flex-shrink-0">
                       <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-purple-50">5</div>
                    </div>
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex-1 relative">
                       <div className="absolute top-4 right-4 text-purple-100"><Gamepad2 size={48} /></div>
                       <h3 className="text-lg font-bold text-slate-800 mb-2">Mode Quiz Interaktif</h3>
                       <p className="text-sm text-slate-600 leading-relaxed">
                          Ingin suasana kelas lebih hidup? Buka menu <strong>Mode Quiz</strong>. Fitur ini memungkinkan Anda menampilkan soal di proyektor untuk dijawab bersama siswa dengan tampilan visual menarik dan penghitung skor otomatis.
                       </p>
                    </div>
                 </div>

                 {/* Step 6 */}
                 <div className="flex gap-6">
                    <div className="flex-shrink-0">
                       <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-green-50">6</div>
                    </div>
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex-1 relative">
                       <div className="absolute top-4 right-4 text-green-100"><FileDown size={48} /></div>
                       <h3 className="text-lg font-bold text-slate-800 mb-2">Unduh Dokumen Word</h3>
                       <p className="text-sm text-slate-600 leading-relaxed">
                          Terakhir, klik tombol biru <strong>"Download .DOC"</strong> di pojok kanan atas. File dokumen yang terunduh sudah rapi dan siap dicetak atau diedit lebih lanjut di Microsoft Word.
                       </p>
                    </div>
                 </div>

                 <div className="flex justify-center pt-8 pb-12">
                     <button 
                        onClick={() => navigateTo('identity')}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:-translate-y-1 transition-all flex items-center gap-3"
                     >
                        Mulai Buat Soal Sekarang <ArrowRight size={20} />
                     </button>
                 </div>

             </div>
          )}

          {/* --- VIEW 1: IDENTITAS GLOBAL --- */}
          {currentView === 'identity' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white shadow-sm border border-gray-300 rounded-sm overflow-hidden mb-6">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                          <BookOpen size={16} className="text-emerald-700" />
                          <h3 className="text-sm font-bold text-slate-700 uppercase">Formulir Identitas</h3>
                      </div>
                      
                      <div className="p-6 space-y-5">
                          {/* Baris 1: Guru & Institusi */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div id="input-teacherName">
                                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Guru / Penyusun</label>
                                  <input type="text" className={`w-full border border-gray-300 bg-white text-slate-900 placeholder:text-gray-400 rounded-sm p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${identityErrors.teacherName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                                      placeholder="Masukkan nama lengkap dan gelar"
                                      value={globalConfig.teacherName} onChange={e => handleGlobalChange('teacherName', e.target.value)} />
                                  {identityErrors.teacherName && <p className="text-red-500 text-[10px] mt-1 italic flex items-center gap-1"><AlertTriangle size={10}/> {identityErrors.teacherName}</p>}
                              </div>
                              <div id="input-institution">
                                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Satuan Pendidikan</label>
                                  <input type="text" className={`w-full border border-gray-300 bg-white text-slate-900 placeholder:text-gray-400 rounded-sm p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${identityErrors.institution ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                      placeholder="Contoh: SMAN 1 Jakarta"
                                      value={globalConfig.institution} onChange={e => handleGlobalChange('institution', e.target.value)} />
                                  {identityErrors.institution && <p className="text-red-500 text-[10px] mt-1 italic flex items-center gap-1"><AlertTriangle size={10}/> {identityErrors.institution}</p>}
                              </div>
                          </div>

                          {/* Baris 2: Jenjang, Fase, Kelas */}
                          <div className="bg-emerald-50/50 p-5 rounded-sm border border-emerald-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div id="input-educationLevel">
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">1. Jenjang Pendidikan</label>
                                      <select className={`w-full border rounded-sm p-2 text-sm bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none ${identityErrors.educationLevel ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                          value={globalConfig.educationLevel} onChange={handleLevelChange}>
                                          <option value="">-- Pilih Jenjang --</option>
                                          {Object.keys(educationMap).map(level => <option key={level} value={level}>{level}</option>)}
                                      </select>
                                      {identityErrors.educationLevel && <p className="text-red-500 text-[10px] mt-1 italic flex items-center gap-1"><AlertTriangle size={10}/> {identityErrors.educationLevel}</p>}
                                  </div>
                                  <div id="input-phase">
                                      <label className={`block text-xs font-bold mb-1.5 ${!globalConfig.educationLevel ? 'text-slate-400' : 'text-slate-700'}`}>
                                          2. {globalConfig.educationLevel === 'Kesetaraan' ? 'Paket' : 'Fase Pembelajaran'}
                                      </label>
                                      <select className={`w-full border rounded-sm p-2 text-sm bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:text-gray-400 ${identityErrors.phase ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                          value={globalConfig.phase} onChange={handlePhaseChange} disabled={!globalConfig.educationLevel}>
                                          <option value="">-- Pilih Fase --</option>
                                          {availablePhases.map((p: any) => <option key={p} value={p}>{p}</option>)}
                                      </select>
                                      {identityErrors.phase && <p className="text-red-500 text-[10px] mt-1 italic flex items-center gap-1"><AlertTriangle size={10}/> {identityErrors.phase}</p>}
                                  </div>
                                  <div id="input-grade">
                                      <label className={`block text-xs font-bold mb-1.5 ${!globalConfig.phase ? 'text-slate-400' : 'text-slate-700'}`}>
                                          3. Kelas
                                      </label>
                                      <select className={`w-full border rounded-sm p-2 text-sm bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:text-gray-400 ${identityErrors.grade ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                          value={globalConfig.grade} onChange={e => handleGlobalChange('grade', e.target.value)} disabled={!globalConfig.phase}>
                                          <option value="">-- Pilih Kelas --</option>
                                          {availableGrades.map((c: any) => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                      {identityErrors.grade && <p className="text-red-500 text-[10px] mt-1 italic flex items-center gap-1"><AlertTriangle size={10}/> {identityErrors.grade}</p>}
                                  </div>
                              </div>
                          </div>

                          {/* Baris 3: Mapel & Topik */}
                          <div className="grid grid-cols-1 gap-6">
                              <div id="input-subject">
                                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Mata Pelajaran</label>
                                  <input type="text" className={`w-full border border-gray-300 bg-white text-slate-900 placeholder:text-gray-400 rounded-sm p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${identityErrors.subject ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                      placeholder="Contoh: Matematika Wajib"
                                      value={globalConfig.subject} onChange={e => handleGlobalChange('subject', e.target.value)} />
                                  {identityErrors.subject && <p className="text-red-500 text-[10px] mt-1 italic flex items-center gap-1"><AlertTriangle size={10}/> {identityErrors.subject}</p>}
                              </div>
                              <div id="input-topic">
                                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Topik / Lingkup Materi</label>
                                  <textarea className={`w-full border border-gray-300 bg-white text-slate-900 placeholder:text-gray-400 rounded-sm p-2 text-sm h-24 resize-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${identityErrors.topic ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                      placeholder="Deskripsikan cakupan materi secara spesifik..."
                                      value={globalConfig.topic} onChange={e => handleGlobalChange('topic', e.target.value)} />
                                  {identityErrors.topic && <p className="text-red-500 text-[10px] mt-1 italic flex items-center gap-1"><AlertTriangle size={10}/> {identityErrors.topic}</p>}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button 
                        onClick={handleNextToTechnical}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-6 rounded-sm shadow-sm flex items-center gap-2 transition-colors text-sm"
                      >
                          Selanjutnya <ArrowRight size={16} />
                      </button>
                  </div>
              </div>
          )}

          {/* --- VIEW 2: TEKNIS SOAL --- */}
          {currentView === 'technical' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* BUILDER (Left) */}
                  <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white shadow-sm border border-gray-300 rounded-sm overflow-hidden">
                          <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center gap-2">
                             <Plus size={16} className="text-emerald-700" />
                             <h3 className="text-sm font-bold text-slate-700 uppercase">Input Bagian Soal</h3>
                          </div>

                          <div className="p-5 space-y-5">
                              {/* Tipe & Opsi */}
                              <div className="space-y-4" id="input-questionType">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Bentuk Soal</label>
                                      <select className={`w-full border rounded-sm p-2 text-sm bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none ${formErrors.questionType ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                          value={currentSection.questionType} onChange={e => {
                                              setCurrentSection({...currentSection, questionType: e.target.value});
                                              if (formErrors.questionType) setFormErrors((prev: any) => ({...prev, questionType: null}));
                                          }}>
                                          <option value="" disabled>Pilih bentuk soal</option>
                                          {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                      {formErrors.questionType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-bold"><AlertTriangle size={12}/> {formErrors.questionType}</p>}
                                  </div>
                                  
                                  {(currentSection.questionType.includes('Pilihan Ganda')) && (
                                      <div>
                                          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Jumlah Opsi</label>
                                          <div className="flex border border-gray-300 rounded-sm overflow-hidden bg-white">
                                              {['3', '4', '5'].map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setCurrentSection({ ...currentSection, optionCount: opt })}
                                                    className={`flex-1 py-1.5 text-xs font-bold border-r last:border-r-0 border-gray-200 transition-colors ${
                                                    currentSection.optionCount === opt
                                                        ? 'bg-emerald-700 text-white'
                                                        : 'text-slate-500 hover:bg-gray-50'
                                                    }`}
                                                    title={`${opt} opsi (${optionCountLabel(opt)})`}
                                                >
                                                    {optionCountLabel(opt)}
                                                </button>
                                                ))}
                                          </div>
                                      </div>
                                  )}

                                  {/* Image Toggle - Formal Checkbox style */}
                                  <div 
                                      className={`p-3 rounded-sm border cursor-pointer flex items-start justify-between transition-colors ${currentSection.withImage ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                                      onClick={() => setCurrentSection({...currentSection, withImage: !currentSection.withImage})}
                                  >
                                      <div className="flex items-start gap-3">
                                          <ImageIcon size={16} className={`mt-0.5 ${currentSection.withImage ? 'text-emerald-700' : 'text-slate-400'}`} />
                                          <div>
                                              <span className="text-xs font-bold text-slate-700 uppercase block">tambah gambar di naskah soal</span>
                                              <p className="text-[10px] text-slate-500 mt-1 font-normal leading-tight">Gambar bisa saja kurang akurat, mohon periksa ulang hasil gambarnya.</p>
                                          </div>
                                      </div>
                                      <div className={`mt-0.5 w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center flex-shrink-0 ${currentSection.withImage ? 'bg-emerald-700 border-emerald-700' : 'bg-white'}`}>
                                          {currentSection.withImage && <Check size={12} className="text-white" />}
                                      </div>
                                  </div>
                              </div>

                              <div className="border-t border-gray-200 my-2"></div>

                              {/* Kesulitan */}
                              <div id="input-difficulties">
                                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Tingkat Kesulitan</label>
                                  <p className="text-[10px] text-slate-500 mb-2 leading-snug">
                                        Bagian ini akan menentukan jumlah soal yang dibuat. Naikkan jumlah angka di sisi kanan untuk memperbanyak jumlah soal.
                                  </p>
                                  <div className={`space-y-2 p-3 rounded-sm border ${formErrors.difficulties ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                                      {['Mudah', 'Sedang', 'Sulit'].map(level => (
                                          <div key={level} className="flex items-center justify-between">
                                              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                                                  <input type="checkbox" checked={currentSection.difficulties[level]} onChange={() => handleDiffCheck(level)} 
                                                      className="w-4 h-4 rounded-sm border-gray-300 text-emerald-700 focus:ring-emerald-500" />
                                                  <span className="font-medium">{level}</span>
                                              </label>
                                              {currentSection.difficulties[level] && (
                                                  <input type="number" className="w-16 p-1 text-sm bg-white text-slate-900 border border-gray-300 rounded-sm text-center focus:ring-1 focus:ring-emerald-500 outline-none" min="1"
                                                      value={currentSection.difficultyCounts[level]} onChange={e => handleDiffCountChange(level, e.target.value)} />
                                              )}
                                          </div>
                                      ))}
                                  </div>
                                  
                                  {/* NEW: Counter Total Soal */}
                                  <div className="mt-2 text-right">
                                      <span className="text-xs font-bold text-slate-500">Total Soal Bagian Ini: </span>
                                      <span className="text-sm font-extrabold text-emerald-700">
                                          {Object.keys(currentSection.difficulties)
                                              .filter(k => currentSection.difficulties[k])
                                              .reduce((acc, curr) => acc + (currentSection.difficultyCounts[curr] || 0), 0)}
                                      </span>
                                  </div>

                                  {formErrors.difficulties && <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-bold"><AlertTriangle size={12}/> {formErrors.difficulties}</p>}
                              </div>

                              {/* Kognitif */}
                              <div id="input-cognitive">
                                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Dimensi Kognitif</label>
                                  
                                  <div className={`space-y-3 ${formErrors.cognitive ? 'p-2 border border-red-300 bg-red-50 rounded-sm' : ''}`}>
                                      {/* LOTS Group */}
                                      <div>
                                          <div className="bg-gray-100 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase border-l-2 border-slate-400 mb-1">LOTS (Lower Order)</div>
                                          <div className="grid grid-cols-3 gap-2">
                                              {lotsLevels.map(level => (
                                                  <button key={level} onClick={() => handleCogCheck(level)}
                                                      className={`text-[10px] px-2 py-2 rounded-sm border transition-all text-center relative ${currentSection.cognitiveLevels[level] ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-600 border-gray-300 hover:bg-gray-50'}`}>
                                                      {currentSection.cognitiveLevels[level] && <Check size={10} className="absolute top-1 right-1" />}
                                                      <span className="font-bold block">{level}</span>
                                                      <span className="text-[9px] font-normal opacity-80">{cognitiveLabels[level]}</span>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>

                                      {/* HOTS Group */}
                                      <div>
                                          <div className="bg-gray-100 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase border-l-2 border-orange-400 mb-1">HOTS (Higher Order)</div>
                                          <div className="grid grid-cols-3 gap-2">
                                              {hotsLevels.map(level => (
                                                  <button key={level} onClick={() => handleCogCheck(level)}
                                                      className={`text-[10px] px-2 py-2 rounded-sm border transition-all text-center relative ${currentSection.cognitiveLevels[level] ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-600 border-gray-300 hover:bg-gray-50'}`}>
                                                      {currentSection.cognitiveLevels[level] && <Check size={10} className="absolute top-1 right-1" />}
                                                      <span className="font-bold block">{level}</span>
                                                      <span className="text-[9px] font-normal opacity-80">{cognitiveLabels[level]}</span>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                                  {formErrors.cognitive && <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-bold"><AlertTriangle size={12}/> {formErrors.cognitive}</p>}
                              </div>

                              <button onClick={openCustomInstrModal} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-sm flex items-center justify-center gap-2 text-sm shadow-sm">
                                  <Plus size={16} /> TAMBAH KE STRUKTUR
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* LIST (Right) */}
                  <div className="lg:col-span-7 flex flex-col">
                      <div className="bg-white shadow-sm border border-gray-300 rounded-sm flex-1 flex flex-col overflow-hidden">
                          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                             <LayoutList size={16} className="text-slate-700" />
                             <h3 className="text-sm font-bold text-slate-700 uppercase">Struktur Paket Soal</h3>
                          </div>
                          
                          <div className="flex-1 p-5 space-y-3 bg-white min-h-[300px]">
                              {sections.map((sec, idx) => (
                                  <div key={sec.id} className="bg-white border border-gray-300 rounded-sm p-4 hover:border-emerald-400 transition-all shadow-sm group relative">
                                      {/* Delete Button - Absolute Top Right */}
                                      <button onClick={() => sec.id && removeSection(sec.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors">
                                          <Trash2 size={16} />
                                      </button>

                                      {/* Header */}
                                      <div className="flex items-center gap-2 mb-3">
                                          <span className="bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wide">BAGIAN {idx + 1}</span>
                                          {sec.withImage && <div className="bg-emerald-100 p-1 rounded-sm"><ImageIcon size={12} className="text-emerald-700" /></div>}
                                      </div>
                                      
                                      <div className="mb-3 pr-6">
                                          <h4 className="font-bold text-sm text-slate-800 uppercase">{sec.questionType}</h4>
                                          {sec.questionType.includes('Pilihan Ganda') && (
                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm inline-block mt-1">
                                                {optionCountLabel(sec.optionCount)} ( {sec.optionCount} opsi )
                                            </span>
                                          )}
                                      </div>

                                      {sec.customInstruction && (
                                      <div className="mt-2 text-[10px] text-slate-600 bg-yellow-50 border border-yellow-200 p-2 rounded-sm">
                                        <span className="font-bold">Custom:</span> {sec.customInstruction}
                                      </div>
                                      )}

                                      {/* Stats Grid */}
                                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-dashed border-gray-200 pt-3">
                                          {/* Col 1: Total & Difficulty */}
                                          <div className="border-r border-gray-200 pr-2">
                                              <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Distribusi Soal</p>
                                              <div className="space-y-1">
                                                  <div className="flex justify-between items-center">
                                                      <span className="text-slate-600">Total</span>
                                                      <span className="font-bold text-slate-800">{sec.totalQuestions}</span>
                                                  </div>
                                                  {['Mudah', 'Sedang', 'Sulit'].map(diff => {
                                                      if(!sec.difficulties[diff]) return null;
                                                      return (
                                                          <div key={diff} className="flex justify-between items-center text-[10px]">
                                                              <span className="text-slate-500">{diff}</span>
                                                              <span className="font-medium bg-gray-100 px-1.5 rounded-sm text-slate-700">{sec.difficultyCounts[diff]}</span>
                                                          </div>
                                                      )
                                                  })}
                                              </div>
                                          </div>

                                          {/* Col 2: Cognitive */}
                                          <div className="pl-1">
                                              <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Kognitif</p>
                                              <div className="flex flex-wrap gap-1">
                                                  {sec.selectedCognitive?.map(cog => (
                                                      <span key={cog} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">
                                                          {cog}
                                                      </span>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                              {sections.length === 0 && (
                                  <div className="h-full flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-gray-200 rounded-sm bg-gray-50/50">
                                      <p className="text-slate-400 text-sm font-medium">Data struktur soal masih kosong.</p>
                                      <p className="text-slate-400 text-xs">Silakan tambahkan bagian soal melalui form di sebelah kiri.</p>
                                  </div>
                              )}
                          </div>

                          <div className="p-5 bg-gray-50 border-t border-gray-200">
                              <button 
                                  onClick={generateExam}
                                  disabled={loading || sections.length === 0}
                                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm uppercase tracking-wide"
                              >
                                  {loading ? <Loader2 className="animate-spin" /> : <Wand2 className="text-yellow-300" />}
                                  {loading ? loadingStatus : 'Buat Naskah Soal'}
                              </button>
                              {error && <div className="mt-3 text-xs text-red-700 bg-red-100 p-2 rounded-sm border border-red-200 flex gap-2 font-medium"><AlertTriangle size={14}/>{error}</div>}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* --- VIEW 3: HASIL SOAL --- */}
          {currentView === 'result' && (
              <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {loading ? (
                      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-sm border border-gray-200 shadow-sm">
                          <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mb-6" />
                          <h3 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-wide">{loadingStatus || 'SEDANG MEMPROSES PERMINTAAN...'}</h3>
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8 max-w-lg text-left shadow-sm rounded-r-sm">
                              <div className="flex">
                                  <div className="flex-shrink-0">
                                      <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                                  </div>
                                  <div className="ml-3">
                                      <p className="text-sm text-yellow-800 font-bold uppercase tracking-wide">
                                          PERINGATAN PENTING
                                      </p>
                                      <p className="text-xs text-yellow-700 mt-1 font-medium leading-relaxed">
                                          Jangan tutup halaman ini. Pastikan layar perangkat Anda tidak mati selama proses berlangsung agar pembuatan soal tidak terputus.
                                      </p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ) : !generatedData ? (
                      <div className="text-center py-20 bg-white rounded-sm border border-gray-300 shadow-sm">
                           <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                           <h3 className="text-lg font-bold text-slate-700 uppercase">Belum Ada Hasil</h3>
                           <p className="text-sm text-slate-500 mt-2">Silakan lengkapi Identitas dan Teknis Soal, lalu klik Generate.</p>
                           <button onClick={() => navigateTo('identity')} className="mt-6 text-emerald-700 font-bold text-sm hover:underline uppercase">
                               Kembali ke Menu Identitas
                           </button>
                      </div>
                  ) : (
                      <div className="bg-white rounded-sm shadow-md border border-gray-300 overflow-hidden relative min-h-[800px] flex flex-col">
                          {/* Toolbar Sticky */}
                          <div className="bg-gray-100 p-3 border-b border-gray-300 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                              <div className="flex gap-1 items-center">
                                  {['soal', 'kunci', 'kisi'].map(t => (
                                      <button key={t} onClick={() => setActiveTab(t)}
                                          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide border rounded-sm transition-colors ${activeTab === t ? 'bg-white border-gray-300 text-emerald-800 shadow-sm' : 'bg-transparent border-transparent text-slate-500 hover:bg-gray-200'}`}>
                                          {t === 'soal' ? 'Naskah Soal' : t === 'kunci' ? 'Kunci Jawaban' : 'Kisi-Kisi'}
                                      </button>
                                  ))}
                              </div>
                              <div className="flex gap-2">
                                  {/* RETRY ALL IMAGES BUTTON */}
                                  {failedImageCount > 0 && (
                                      <button 
                                        onClick={handleRetryFailedImages}
                                        disabled={imageProgress.active}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-emerald-900 px-4 py-1.5 rounded-sm shadow-sm flex items-center gap-2 text-xs font-bold transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                          {imageProgress.active ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                                          Lengkapi Gambar ({failedImageCount})
                                      </button>
                                  )}
                                  
                                  <button onClick={handleExportWord} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-sm shadow-sm flex items-center gap-2 text-xs font-bold transition-colors uppercase">
                                      <FileDown size={14} /> Download .DOC
                                  </button>
                              </div>
                          </div>

                          {/* Paper View - Scrollable */}
                          <div className="p-10 bg-gray-500/10 min-h-[700px] overflow-auto flex-1">
                              <div className="max-w-4xl mx-auto bg-white shadow-lg p-10 min-h-[1000px]">
                                  {/* Header Kertas Formal */}
                                  <div className="text-center border-b-2 border-black pb-4 mb-6">
                                      <h1 className="text-lg font-bold uppercase font-serif text-black">Naskah Soal Ujian</h1>
                                      <p className="text-sm font-serif text-black">{globalConfig.institution}</p>
                                  </div>

                                  {activeTab === 'soal' && generatedData.ujian.map((part, idx) => (
                                      <div key={idx} className="mb-6">
                                          <h3 className="font-bold text-black uppercase mb-4 text-sm border-b border-black inline-block pb-1">
                                              {part.judul_bagian}
                                          </h3>
                                          <div className="space-y-4">
                                              {(part.soal || []).map((q, qIdx) => {
                                                  // Cek apakah item ini sedang loading
                                                  const uniqueId = `${idx}-${qIdx}`;
                                                  const isRegenerating = regeneratingIds[uniqueId];
                                                  const isRegeneratingText = regeneratingQuestionIds[uniqueId];
                                                  const isEditingPrompt = editingPromptId === uniqueId;
                                                  
                                                  return (
                                                  <div key={qIdx} className={`flex gap-3 text-sm font-serif leading-relaxed text-black transition-opacity ${isRegeneratingText ? 'opacity-50' : 'opacity-100'}`}>
                                                      <span className="font-bold w-5 flex-shrink-0">{q.no}.</span>
                                                      <div className="w-full">
                                                          {/* Soal Text */}
                                                          <div className="mb-2" dangerouslySetInnerHTML={createMarkup(q.pertanyaan)} />
                                                          
                                                          {/* Area Gambar - DIPERBAIKI: Tetap muncul jika ada prompt meski gambar null */}
                                                          {(q.image || q.image_prompt || isRegenerating || isEditingPrompt) && (
                                                              <div className="flex flex-col md:flex-row items-start gap-4 mb-3 border border-gray-200 p-2 rounded-sm bg-gray-50/50">
                                                                  <div className="relative border border-black p-1 inline-block min-w-[150px] min-h-[100px] bg-white flex items-center justify-center self-stretch">
                                                                      {isRegenerating && (
                                                                          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                                                                              <Loader2 className="animate-spin text-emerald-600" size={24} />
                                                                          </div>
                                                                      )}
                                                                      {q.image ? (
                                                                          <img src={q.image} alt="Ilustrasi" className="max-w-[200px] h-auto" />
                                                                      ) : (
                                                                          <div className="text-center p-2">
                                                                              <ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                                                                              <span className="text-[10px] text-gray-400 font-sans leading-tight block">
                                                                                  {q.image_prompt ? 'Sedang digambar...' : 'Tidak ada gambar'}
                                                                              </span>
                                                                          </div>
                                                                      )}
                                                                  </div>
                                                                  
                                                                  <div className="flex-1 w-full">
                                                                      {isEditingPrompt ? (
                                                                          // TAMPILAN MODE EDIT PROMPT
                                                                          <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                                                              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Edit Deskripsi Gambar (Prompt)</label>
                                                                              <textarea 
                                                                                  value={tempPromptValue}
                                                                                  onChange={(e) => setTempPromptValue(e.target.value)}
                                                                                  className="w-full text-xs p-2 border border-emerald-300 bg-white text-slate-900 rounded-sm focus:ring-1 focus:ring-emerald-500 outline-none h-20 font-sans"
                                                                                  placeholder="Deskripsikan gambar yang diinginkan secara spesifik dalam Bahasa Inggris..."
                                                                              />
                                                                              <div className="flex gap-2 justify-end">
                                                                                  <button 
                                                                                      onClick={handleCancelEditPrompt}
                                                                                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 font-sans uppercase"
                                                                                  >
                                                                                      Batal
                                                                                  </button>
                                                                                  <button 
                                                                                      onClick={() => handleSaveAndRegeneratePrompt(idx, qIdx)}
                                                                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold font-sans uppercase flex items-center gap-1.5 shadow-sm"
                                                                                  >
                                                                                      <Save size={12} /> Simpan & Generate
                                                                                  </button>
                                                                              </div>
                                                                          </div>
                                                                      ) : (
                                                                          // TAMPILAN NORMAL (TOMBOL AKSI)
                                                                          <div className="flex flex-col gap-2 h-full justify-center">
                                                                              <div className="text-[10px] text-slate-400 font-sans italic mb-1 line-clamp-2 leading-tight">
                                                                                  Prompt: "{q.image_prompt || 'No prompt'}"
                                                                              </div>
                                                                              <div className="flex flex-wrap gap-2">
                                                                                  <button 
                                                                                    onClick={() => handleStartEditPrompt(idx, qIdx, q.image_prompt)}
                                                                                    disabled={isRegenerating || isRegeneratingText}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-sm text-yellow-800 text-xs font-bold font-sans uppercase tracking-wide transition-colors disabled:opacity-50"
                                                                                  >
                                                                                      <Edit3 size={12} />
                                                                                      Edit Prompt
                                                                                  </button>

                                                                                  <button 
                                                                                    onClick={() => handleRegenerateImage(idx, qIdx, q.image_prompt)}
                                                                                    disabled={isRegenerating || isRegeneratingText}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-sm text-emerald-700 text-xs font-bold font-sans uppercase tracking-wide transition-colors disabled:opacity-50 group"
                                                                                  >
                                                                                      <RefreshCw size={12} className={isRegenerating ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                                                                                      Buat Ulang
                                                                                  </button>

                                                                                  <button 
                                                                                    onClick={() => handleDeleteImage(idx, qIdx)}
                                                                                    disabled={isRegenerating || !q.image || isRegeneratingText}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-sm text-red-700 text-xs font-bold font-sans uppercase tracking-wide transition-colors disabled:opacity-50"
                                                                                  >
                                                                                      <Trash2 size={12} />
                                                                                      Hapus
                                                                                  </button>
                                                                              </div>
                                                                          </div>
                                                                      )}
                                                                  </div>
                                                              </div>
                                                          )}
                                                          {/* Opsi hanya tampil jika Tipe Soal mengandung 'Pilihan Ganda' */}
                                                          {q.opsi && part.tipe.toLowerCase().includes('pilihan ganda') && (
                                                              <div className="space-y-1 ml-1 mb-3">
                                                                  {q.opsi.map((opt, oIdx) => {
                                                                      const letter = String.fromCharCode(65 + oIdx);
                                                                      const cleanOpt = cleanOptionText(opt);

                                                                      return (
                                                                          <div key={oIdx} className="flex items-start gap-2">
                                                                              <div className="font-bold w-4">{letter}.</div>
                                                                              <div dangerouslySetInnerHTML={createMarkup(cleanOpt)} />
                                                                          </div>
                                                                      )
                                                                  })}
                                                              </div>
                                                          )}

                                                          {/* --- TOMBOL REGENERATE TEXT (NEW) --- */}
                                                          <button
                                                              onClick={() => handleRegenerateQuestion(idx, qIdx)}
                                                              disabled={isRegeneratingText || isRegenerating}
                                                              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-sans font-bold text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                          >
                                                              <Repeat size={10} className={isRegeneratingText ? "animate-spin" : ""} />
                                                              {isRegeneratingText ? "Sedang membuat soal baru..." : "Buat Soal Ulang"}
                                                          </button>
                                                      </div>
                                                  </div>
                                              )})}
                                          </div>
                                      </div>
                                  ))}

                                  {activeTab === 'kunci' && (
                                      <div className="grid grid-cols-1 gap-6">
                                          {generatedData.ujian.map((part, idx) => (
                                            <div key={idx}>
                                                <h4 className="font-bold border-b border-black mb-2 uppercase text-sm text-black">{part.judul_bagian}</h4>
                                                <table className="w-full text-xs font-serif border-collapse border border-black text-black">
                                                    <thead>
                                                        <tr className="bg-gray-100 text-black"><th className="border border-black p-1 w-10">No</th><th className="border border-black p-1">Jawaban</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {(part.soal || []).map(q => (
                                                            <tr key={q.no}><td className="border border-black p-1 text-center font-bold">{q.no}</td><td className="border border-black p-1 pl-2">{q.kunci}</td></tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                          ))}
                                      </div>
                                  )}

                                  {activeTab === 'kisi' && (
                                      <table className="w-full text-xs font-serif border-collapse border border-black text-black">
                                          <thead>
                                              <tr className="bg-gray-100 text-black">
                                                  <th className="border border-black p-2">Bagian</th>
                                                  <th className="border border-black p-2 w-10">No</th>
                                                  <th className="border border-black p-2">Materi</th>
                                                  <th className="border border-black p-2">Indikator</th>
                                                  <th className="border border-black p-2 w-16">Level</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {generatedData.ujian.flatMap(part => (part.kisi_kisi || []).map((row, rIdx) => (
                                                  <tr key={`${part.tipe}-${rIdx}`}>
                                                      <td className="border border-black p-2">{part.tipe}</td>
                                                      <td className="border border-black p-2 text-center font-bold">{row.no}</td>
                                                      <td className="border border-black p-2">{row.materi}</td>
                                                      <td className="border border-black p-2">{row.indikator}</td>
                                                      <td className="border border-black p-2 text-center">{row.level}</td>
                                                  </tr>
                                              )))}
                                          </tbody>
                                      </table>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* --- VIEW 4: MODE QUIZ --- */}
          {currentView === 'quiz' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                  {/* HEADER MODE QUIZ (HANYA MUNCUL DI EDIT MODE) */}
                  {!isPlayMode && (
                      <div className="mb-6 flex justify-between items-center border-b border-gray-300 pb-4">
                         <div>
                            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                               <Gamepad2 className="text-emerald-700" /> Mode Quiz Interaktif
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                               {quizMode === 'edit' ? 'Persiapan Kuis: Cek kelengkapan gambar dan konten sebelum bermain.' : 'Kuis sedang berlangsung...'}
                            </p>
                         </div>
                      </div>
                  )}

                  {/* SUB-VIEW: EDIT QUIZ (PREPARATION) */}
                  {quizMode === 'edit' && generatedData && (
                      <div className="flex-1 flex flex-col">
                          <div className="flex-1 bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden flex flex-col">
                              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                  <h3 className="font-bold text-slate-700 text-sm uppercase">Daftar Soal Siap Kuis</h3>
                                  <div className="text-xs text-slate-500 font-medium">Total Soal: {generatedData.ujian.reduce((acc, part) => acc + (part.soal ? part.soal.length : 0), 0)}</div>
                              </div>
                              
                              <div className="flex-1 overflow-y-auto p-6 bg-gray-100 space-y-4">
                                  {generatedData.ujian.map((part, idx) => (
                                      <div key={idx} className="space-y-4">
                                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{part.judul_bagian}</div>
                                          {(part.soal || []).map((q, qIdx) => {
                                              const isRegenerating = regeneratingIds[`${idx}-${qIdx}`];
                                              const isRegeneratingText = regeneratingQuestionIds[`${idx}-${qIdx}`];

                                              return (
                                                  <div key={qIdx} className={`bg-white p-4 rounded-sm border border-gray-200 shadow-sm flex gap-4 ${isRegeneratingText ? 'opacity-50' : 'opacity-100'}`}>
                                                      <div className="font-bold text-emerald-800 text-lg w-8 text-center bg-emerald-50 rounded-sm pt-1">{q.no}</div>
                                                      <div className="flex-1">
                                                          <div className="mb-2 text-sm font-medium" dangerouslySetInnerHTML={createMarkup(q.pertanyaan)} />
                                                          
                                                          {/* Image Control in Edit Mode */}
                                                          {(q.image || q.image_prompt) && (
                                                              <div className="flex items-start gap-4 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-sm">
                                                                  <div className="relative border border-gray-300 p-1 bg-white min-w-[100px] min-h-[80px] flex items-center justify-center">
                                                                      {isRegenerating ? <Loader2 className="animate-spin text-emerald-500" /> : 
                                                                       q.image ? <img src={q.image} alt="Ilustrasi" className="max-w-[150px] h-auto" /> : <span className="text-xs text-gray-400">Tidak ada gambar</span>}
                                                                  </div>
                                                                  <div className="space-y-2">
                                                                      <button 
                                                                        onClick={() => handleRegenerateImage(idx, qIdx, q.image_prompt)}
                                                                        disabled={isRegenerating || isRegeneratingText}
                                                                        className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline disabled:opacity-50"
                                                                      >
                                                                          <RefreshCw size={12} className={isRegenerating ? "animate-spin" : ""} /> Buat Ulang Gambar
                                                                      </button>
                                                                      {q.image && (
                                                                          <button 
                                                                            onClick={() => handleDeleteImage(idx, qIdx)}
                                                                            disabled={isRegeneratingText}
                                                                            className="flex items-center gap-2 text-xs font-bold text-red-600 hover:underline"
                                                                          >
                                                                              <Trash2 size={12} /> Hapus Gambar
                                                                          </button>
                                                                      )}
                                                                  </div>
                                                              </div>
                                                          )}

                                                          {/* Action Bar for Quiz Edit Mode */}
                                                          <div className="mt-2 flex">
                                                              <button
                                                                  onClick={() => handleRegenerateQuestion(idx, qIdx)}
                                                                  disabled={isRegeneratingText || isRegenerating}
                                                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-sm transition-colors disabled:opacity-50"
                                                              >
                                                                  <Repeat size={12} className={isRegeneratingText ? "animate-spin" : ""} />
                                                                  {isRegeneratingText ? "Sedang membuat soal baru..." : "Buat Soal Ulang"}
                                                              </button>
                                                          </div>
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  ))}
                              </div>

                              <div className="p-4 bg-white border-t border-gray-200">
                                  <button 
                                    onClick={startQuiz}
                                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 rounded-sm shadow-md text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-transform hover:-translate-y-0.5"
                                  >
                                      <Play size={24} fill="currentColor" /> Mulai Kuis Interaktif
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* SUB-VIEW: PLAY MODE */}
                  {quizMode === 'play' && quizState.flatQuestions.length > 0 && (
                      <div className="flex-1 bg-slate-900 overflow-hidden flex flex-col relative text-white p-8">
                          
                          {/* Close Button (X) */}
                          <button
                              onClick={() => setQuizMode('edit')}
                              className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all z-50"
                          >
                              <X size={32} />
                          </button>

                          {/* Progress Bar */}
                          <div className="absolute top-0 left-0 h-2 bg-emerald-600 transition-all duration-500" style={{width: `${((quizState.currentIdx + 1) / quizState.flatQuestions.length) * 100}%`}}></div>
                          
                          {/* Score Header REMOVED */}

                          {/* Question Area */}
                          <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full pt-16">
                              <div className="mb-4 text-emerald-300 font-bold uppercase tracking-widest text-sm">
                                  Soal {quizState.currentIdx + 1} dari {quizState.flatQuestions.length}
                              </div>
                              
                              {/* Image Display - Large (Resized Smaller) */}
                              {quizState.flatQuestions[quizState.currentIdx].image && (
                                  <div className="mb-6 p-2 bg-white rounded-lg shadow-lg">
                                      <img 
                                        src={quizState.flatQuestions[quizState.currentIdx].image || undefined} 
                                        alt="Soal" 
                                        className="max-h-[200px] md:max-h-[280px] object-contain rounded-md" 
                                      />
                                  </div>
                              )}

                              <div 
                                className="text-2xl md:text-4xl font-bold text-center leading-tight mb-10 drop-shadow-md"
                                dangerouslySetInnerHTML={createMarkup(quizState.flatQuestions[quizState.currentIdx].pertanyaan)}
                              />

                              {/* Options Grid */}
                              {quizState.flatQuestions[quizState.currentIdx].type!.includes('Pilihan Ganda') ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                      {quizState.flatQuestions[quizState.currentIdx].opsi!.map((opt, oIdx) => {
                                          const letter = String.fromCharCode(65 + oIdx);
                                          const cleanOpt = cleanOptionText(opt);
                                          const isSelected = quizState.selectedOptionIdx === oIdx;
                                          const isCorrectKey = String.fromCharCode(65 + oIdx) === quizState.flatQuestions[quizState.currentIdx].kunci.trim().charAt(0).toUpperCase();
                                          
                                          // Warna Tombol
                                          let btnClass = "bg-white/10 hover:bg-white/20 border-white/20 text-white";
                                          if (quizState.isAnswered) {
                                              if (isCorrectKey) btnClass = "bg-green-600 border-green-500 text-white ring-4 ring-green-500/30"; // Jawaban Benar selalu hijau
                                              else if (isSelected && !isCorrectKey) btnClass = "bg-red-600 border-red-500 text-white opacity-50"; // Jawaban Salah jadi merah
                                              else btnClass = "bg-white/5 text-gray-400 opacity-30"; // Sisanya redup
                                          }

                                          return (
                                              <button 
                                                  key={oIdx}
                                                  onClick={() => handleQuizAnswer(oIdx)}
                                                  disabled={quizState.isAnswered}
                                                  className={`p-6 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 group ${btnClass}`}
                                              >
                                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl border-2 ${quizState.isAnswered && isCorrectKey ? 'bg-white text-green-700 border-white' : 'bg-transparent border-current'}`}>
                                                      {letter}
                                                  </div>
                                                  <div className="text-xl font-medium" dangerouslySetInnerHTML={createMarkup(cleanOpt)} />
                                                  {quizState.isAnswered && isCorrectKey && <Check className="ml-auto text-white w-8 h-8" />}
                                                  {quizState.isAnswered && isSelected && !isCorrectKey && <X className="ml-auto text-white w-8 h-8" />}
                                              </button>
                                          );
                                      })}
                                  </div>
                              ) : (
                                  // Non-PG Fallback
                                  <div className="w-full text-center space-y-6">
                                      <div className="text-slate-400 italic">Soal ini bukan Pilihan Ganda. Diskusikan jawabannya bersama kelas!</div>
                                      {!quizState.showAnswer ? (
                                          <button 
                                            onClick={() => setQuizState(prev => ({...prev, showAnswer: true, isAnswered: true}))}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-full text-lg shadow-lg"
                                          >
                                              Lihat Kunci Jawaban
                                          </button>
                                      ) : (
                                          <div className="bg-green-600 p-6 rounded-xl border border-green-500 animate-in zoom-in">
                                              <div className="text-green-200 text-sm font-bold uppercase mb-2">Jawaban Benar</div>
                                              <div className="text-2xl font-bold">{quizState.flatQuestions[quizState.currentIdx].kunci}</div>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>

                          {/* Footer Navigation */}
                          <div className="mt-8 flex justify-end items-center border-t border-white/10 pt-4 h-16">
                              {/* Removed 'Keluar Quiz' bottom button as X button handles exit now */}
                              
                              {quizState.isAnswered && (
                                  <button 
                                    onClick={handleNextQuestion}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-10 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-right"
                                  >
                                      Selanjutnya <ArrowRight size={20} />
                                  </button>
                              )}
                          </div>
                      </div>
                  )}

                  {/* SUB-VIEW: SCORE RESULT */}
                  {quizMode === 'score' && (
                      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center animate-in zoom-in duration-500 relative">
                           {/* Close Button (X) also on Score Screen */}
                           <button
                              onClick={() => setQuizMode('edit')}
                              className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all z-50"
                          >
                              <X size={32} />
                          </button>

                          <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                          <h2 className="text-4xl md:text-5xl font-bold mb-2">Kuis Selesai!</h2>
                          <p className="text-emerald-200 text-xl mb-10">Terima kasih telah berpartisipasi</p>
                          
                          {/* Score Result REMOVED */}

                          <div className="flex gap-4">
                              <button 
                                onClick={startQuiz}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2"
                              >
                                  <RotateCcw size={18} /> Main Lagi
                              </button>
                              <button 
                                onClick={() => setQuizMode('edit')}
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2"
                              >
                                  <Settings size={18} /> Mode Edit
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          )}

        </main>

        {/* --- FOOTER COPYRIGHT --- */}
        {showSidebar && (
        <footer className={`fixed bottom-0 right-0 w-full bg-gray-200 border-t border-gray-300 py-2 z-40 ${currentView !== 'welcome' ? 'md:w-[calc(100%-14rem)]' : ''}`}>
            <div className="max-w-7xl mx-auto px-6 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                © 2025. | Version 1.2 (Stable)
            </div>
        </footer>
        )}
      </div>
    </div>
  );
};

export default Sdn14Generator;