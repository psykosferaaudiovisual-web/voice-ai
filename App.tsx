import React, { useState, useRef, useEffect } from 'react';
import { AgeGroup, Gender, GeneratedAudio, GeminiVoiceName, Mood, VoiceConfiguration, VoiceStyle, SavedVoice, EqualizerSettings, PostProcessingSettings } from './types';
import VoiceControls from './components/VoiceControls';
import CloningPanel from './components/CloningPanel';
import MimicPanel from './components/MimicPanel';
import AudioPlayer from './components/AudioPlayer';
import EqualizerPanel from './components/EqualizerPanel';
import GeminiKeyPanel from './components/GeminiKeyPanel';
import { generateSpeech, generateSpeechFromAudio } from './services/geminiService';
import { decodeAudioData } from './services/audioUtils';

// Default config
const DEFAULT_CONFIG: VoiceConfiguration = {
  id: 'default',
  name: 'Estándar',
  gender: Gender.FEMALE,
  age: AgeGroup.ADULT,
  pitch: 1.0,
  speed: 1.0,
  stability: 0.5,
  intensity: 0.6,
  style: VoiceStyle.NEUTRAL,
  mood: Mood.NEUTRAL,
  geminiVoice: GeminiVoiceName.Kore,
  isCloned: false
};

const DEFAULT_EQ: EqualizerSettings = {
    low: 0,
    midLow: 0,
    mid: 0,
    midHigh: 0,
    high: 0
};

const DEFAULT_POST: PostProcessingSettings = {
    playbackRate: 1.0,
    detune: 0
};

export default function App() {
  const [config, setConfig] = useState<VoiceConfiguration>(DEFAULT_CONFIG);
  
  // Load saved voices from LocalStorage
  const [savedVoices, setSavedVoices] = useState<SavedVoice[]>(() => {
      const saved = localStorage.getItem('voxclon_saved_voices');
      return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState('');
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'clone' | 'mimic'>('generate');
  
  // Audio Settings State
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(DEFAULT_EQ);
  const [postSettings, setPostSettings] = useState<PostProcessingSettings>(DEFAULT_POST);
  
  // Shared analyser node to visualize the currently playing audio
  const [currentAnalyser, setCurrentAnalyser] = useState<AnalyserNode | null>(null);

  // Ref for AudioContext to persist across renders
  const audioContextRef = useRef<AudioContext | null>(null);

  // Persist Saved Voices
  useEffect(() => {
      localStorage.setItem('voxclon_saved_voices', JSON.stringify(savedVoices));
  }, [savedVoices]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // --- Voice Management ---
  const handleSaveVoice = (newVoice: VoiceConfiguration) => {
      const voiceToSave: SavedVoice = { ...newVoice, savedAt: Date.now() };
      setSavedVoices(prev => [...prev, voiceToSave]);
  };

  const handleDeleteVoice = (id: string) => {
      setSavedVoices(prev => prev.filter(v => v.id !== id));
  };

  const handleLoadVoice = (voice: SavedVoice) => {
      const { savedAt, ...configToLoad } = voice;
      setConfig(configToLoad);
      // Optional: Give feedback
  };

  // --- Audio History Management ---
  const handleDeleteAudio = (id: string) => {
      // Removed confirm() for better UX based on user feedback.
      // If user clicks delete, it goes away immediately.
      setGeneratedAudios(prev => prev.filter(a => a.id !== id));
  }

  const addAudioToHistory = async (base64Audio: string, label: string) => {
    const ctx = getAudioContext();
    const buffer = await decodeAudioData(base64Audio, ctx);

    const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        text: label,
        audioBuffer: buffer,
        timestamp: new Date(),
        duration: buffer.duration
    };

    setGeneratedAudios(prev => [newAudio, ...prev]);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    try {
        const base64Audio = await generateSpeech(text, config);
        await addAudioToHistory(base64Audio, text);
    } catch (e) {
        console.error("Failed to generate:", e);
        alert("Error generando audio. Verifica tu API KEY y conexión.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleMimic = async (audioBlob: Blob) => {
      setIsGenerating(true);
      try {
          const base64Audio = await generateSpeechFromAudio(audioBlob, config);
          await addAudioToHistory(base64Audio, `(Imitación) Voz: ${config.geminiVoice}`);
      } catch (e) {
          console.error("Failed to mimic:", e);
          alert("Error imitando audio. Puede que el audio sea muy largo o haya problemas de conexión.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleCloningComplete = (partialConfig: Partial<VoiceConfiguration>) => {
      setConfig(prev => ({ ...prev, ...partialConfig }));
      setActiveTab('generate'); // Switch back to generator
      alert("¡Perfil de voz clonado con éxito!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        {/* Main Body */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24"> 
          
          {/* Left Sidebar: Controls */}
          <div className="lg:col-span-4 space-y-6">
              <div className="mb-8">
                  <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                      VoxClon IA
                  </h1>
                  <p className="text-slate-500 mt-2 text-sm">Estudio Profesional de Voces</p>
              </div>

              <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
                  <button
                      onClick={() => setActiveTab('generate')}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                          activeTab === 'generate' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'
                      }`}
                  >
                      Generador
                  </button>
                  <button
                      onClick={() => setActiveTab('mimic')}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                          activeTab === 'mimic' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'
                      }`}
                  >
                      Imitar
                  </button>
                  <button
                      onClick={() => setActiveTab('clone')}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                          activeTab === 'clone' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'
                      }`}
                  >
                      Clonar
                  </button>
              </div>

              {activeTab === 'clone' ? (
                  <CloningPanel onCloningComplete={handleCloningComplete} />
              ) : (
                  <>
                    <VoiceControls 
                      config={config} 
                      onChange={setConfig}
                      savedVoices={savedVoices}
                      onSaveVoice={handleSaveVoice}
                      onDeleteVoice={handleDeleteVoice}
                      onLoadVoice={handleLoadVoice}
                    />

                    <div className="mt-4">
                      <GeminiKeyPanel />
                    </div>
                  </>
              )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
              
              {activeTab === 'generate' && (
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                          Guion a locutar
                      </label>
                      <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Escribe el texto aquí..."
                          className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-lg leading-relaxed"
                      />
                      
                      <div className="mt-4 flex justify-end items-center">
                          <button
                              onClick={handleGenerate}
                              disabled={isGenerating || !text.trim()}
                              className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                                  isGenerating || !text.trim()
                                  ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
                                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transform hover:scale-105'
                              }`}
                          >
                              {isGenerating ? 'Procesando...' : 'Generar Audio'}
                          </button>
                      </div>
                  </div>
              )}

              {activeTab === 'mimic' && (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                      <MimicPanel onMimic={handleMimic} isGenerating={isGenerating} />
                  </div>
              )}

              {activeTab === 'clone' && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-300">
                    <h2 className="text-xl font-bold text-white mb-4">Instrucciones de Clonación</h2>
                    <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4 text-sm">
                        <li>Sube un audio de referencia.</li>
                        <li>El sistema extraerá parámetros como Tono, Estabilidad e Intensidad.</li>
                        <li>Estos valores se aplicarán al panel de control.</li>
                    </ul>
                </div>
            )}

              {/* Generated List */}
              <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                      <span>Línea de Tiempo</span>
                      <span className="text-xs normal-case bg-slate-800 px-2 py-1 rounded">{generatedAudios.length} audios</span>
                  </h2>
                  <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                       {generatedAudios.length === 0 && (
                           <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                               Sin audios generados.
                           </div>
                       )}
                       {generatedAudios.map((item) => (
                           <AudioPlayer 
                              key={item.id} 
                              item={item} 
                              onDelete={handleDeleteAudio}
                              getAudioContext={getAudioContext}
                              eqSettings={eqSettings}
                              postSettings={postSettings}
                              setAnalyser={setCurrentAnalyser}
                           />
                       ))}
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom: Equalizer & Post Production */}
      <div className="sticky bottom-0 z-50">
        <EqualizerPanel 
            settings={eqSettings} 
            postSettings={postSettings}
            onUpdateEQ={setEqSettings} 
            onUpdatePost={setPostSettings}
            analyserNode={currentAnalyser} 
        />
      </div>

    </div>
  );
}
