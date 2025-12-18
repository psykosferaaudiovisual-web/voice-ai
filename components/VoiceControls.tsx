import React, { useState } from 'react';
import { AgeGroup, Gender, VoiceConfiguration, VoiceStyle, Mood, GeminiVoiceName, SavedVoice } from '../types';

interface VoiceControlsProps {
  config: VoiceConfiguration;
  onChange: (newConfig: VoiceConfiguration) => void;
  savedVoices: SavedVoice[];
  onSaveVoice: (config: VoiceConfiguration) => void;
  onDeleteVoice: (id: string) => void;
  onLoadVoice: (voice: SavedVoice) => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({ 
    config, onChange, savedVoices, onSaveVoice, onDeleteVoice, onLoadVoice 
}) => {
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState("");
  
  const handleGenderChange = (gender: Gender) => {
    let newVoice = config.geminiVoice;
    if (gender === Gender.MALE && (newVoice === GeminiVoiceName.Kore || newVoice === GeminiVoiceName.Zephyr)) {
        newVoice = GeminiVoiceName.Fenrir; 
    } else if (gender === Gender.FEMALE && (newVoice !== GeminiVoiceName.Kore && newVoice !== GeminiVoiceName.Zephyr)) {
        newVoice = GeminiVoiceName.Kore; 
    }
    onChange({ ...config, gender, geminiVoice: newVoice });
  };

  const handleGeminiVoiceChange = (voice: GeminiVoiceName) => {
      let newGender = config.gender;
      if ([GeminiVoiceName.Fenrir, GeminiVoiceName.Charon, GeminiVoiceName.Puck].includes(voice)) {
          newGender = Gender.MALE;
      } else {
          newGender = Gender.FEMALE;
      }
      onChange({ ...config, geminiVoice: voice, gender: newGender });
  }

  const saveCurrentVoice = () => {
      if(!newVoiceName.trim()) return;
      onSaveVoice({ ...config, name: newVoiceName, id: Date.now().toString() });
      setNewVoiceName("");
      setShowSaveInput(false);
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
      
      {/* Saved Voices Section */}
      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Mis Voces</h3>
              <button 
                onClick={() => setShowSaveInput(!showSaveInput)}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded"
              >
                  + Guardar Actual
              </button>
          </div>
          
          {showSaveInput && (
              <div className="flex gap-2 mb-3 animate-in fade-in slide-in-from-top-2">
                  <input 
                    type="text" 
                    value={newVoiceName}
                    onChange={(e) => setNewVoiceName(e.target.value)}
                    placeholder="Nombre de la voz..."
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 text-sm text-white"
                  />
                  <button onClick={saveCurrentVoice} className="text-xs bg-green-600 text-white px-3 rounded">Guardar</button>
              </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2">
              {savedVoices.length === 0 && <span className="text-xs text-slate-500 italic">No hay voces guardadas.</span>}
              {savedVoices.map(voice => (
                  <div key={voice.id} className="flex-shrink-0 bg-slate-800 border border-slate-600 rounded-lg p-2 min-w-[120px] relative group">
                      <p className="text-xs font-bold text-slate-200 truncate pr-4" title={voice.name}>{voice.name}</p>
                      <p className="text-[10px] text-slate-500">{voice.geminiVoice}</p>
                      <button 
                        onClick={() => onLoadVoice(voice)}
                        className="mt-2 w-full text-[10px] bg-slate-700 hover:bg-slate-600 py-1 rounded text-slate-300"
                      >
                          Cargar
                      </button>
                      <button 
                        onClick={() => onDeleteVoice(voice.id)}
                        className="absolute top-1 right-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          &times;
                      </button>
                  </div>
              ))}
          </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Configuración
        </h2>
        {config.isCloned && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                Clonada
            </span>
        )}
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Género</label>
          <div className="flex bg-slate-900 rounded-lg p-1">
            {Object.values(Gender).map((g) => (
              <button
                key={g}
                onClick={() => handleGenderChange(g)}
                className={`flex-1 py-2 text-xs rounded-md transition-colors ${
                  config.gender === g
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Edad</label>
          <select
            value={config.age}
            onChange={(e) => onChange({ ...config, age: e.target.value as AgeGroup })}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {Object.values(AgeGroup).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Modelo Base</label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {[
                { id: GeminiVoiceName.Kore, label: 'Kore (Fem)' },
                { id: GeminiVoiceName.Zephyr, label: 'Zephyr (Fem)' },
                { id: GeminiVoiceName.Puck, label: 'Puck (Masc)' },
                { id: GeminiVoiceName.Charon, label: 'Charon (Masc)' },
                { id: GeminiVoiceName.Fenrir, label: 'Fenrir (Masc)' },
            ].map((voice) => (
                <button
                    key={voice.id}
                    onClick={() => handleGeminiVoiceChange(voice.id)}
                    className={`px-2 py-2 text-xs border rounded-lg text-center transition-all ${
                        config.geminiVoice === voice.id
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                    }`}
                >
                    {voice.label}
                </button>
            ))}
        </div>
      </div>

      {/* Detailed Sliders */}
      <div className="space-y-4">
        {/* Speed */}
        <div>
            <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">Velocidad</label>
                <span className="text-xs text-purple-400">{config.speed.toFixed(1)}x</span>
            </div>
            <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.speed}
                onChange={(e) => onChange({ ...config, speed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
        </div>
        
        {/* Pitch */}
        <div> 
            <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">Tono (Grave - Agudo)</label>
                <span className="text-xs text-purple-400">{(config.pitch * 100).toFixed(0)}%</span>
            </div>
            <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={config.pitch}
                onChange={(e) => onChange({ ...config, pitch: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
        </div>

        {/* Stability */}
        <div> 
            <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">Estabilidad (Variable - Monótono)</label>
                <span className="text-xs text-purple-400">{(config.stability * 100).toFixed(0)}%</span>
            </div>
            <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={config.stability}
                onChange={(e) => onChange({ ...config, stability: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
        </div>

        {/* Intensity */}
        <div> 
            <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">Intensidad (Suave - Fuerte)</label>
                <span className="text-xs text-purple-400">{(config.intensity * 100).toFixed(0)}%</span>
            </div>
            <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={config.intensity}
                onChange={(e) => onChange({ ...config, intensity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
        </div>
      </div>

      {/* Style & Mood */}
      <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Estilo</label>
          <select
            value={config.style}
            onChange={(e) => onChange({ ...config, style: e.target.value as VoiceStyle })}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {Object.values(VoiceStyle).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
         <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Ánimo</label>
          <select
            value={config.mood}
            onChange={(e) => onChange({ ...config, mood: e.target.value as Mood })}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {Object.values(Mood).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
};

export default VoiceControls;
