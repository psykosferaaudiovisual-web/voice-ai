import React, { useEffect, useState } from 'react';
import { setApiKey, getApiKey, testApiKey } from '../services/geminiService';

export default function GeminiKeyPanel() {
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState<'idle'|'testing'|'success'|'error'>('idle');

  useEffect(() => {
    const fromStorage = localStorage.getItem('GEMINI_API_KEY');
    if (fromStorage) {
      setKeyInput(fromStorage);
      setApiKey(fromStorage);
    } else {
      const envKey = getApiKey();
      if (envKey) setKeyInput(envKey);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', keyInput);
    setApiKey(keyInput);
    setStatus('idle');
    alert('API Key guardada.');
  };

  const handleClear = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    setKeyInput('');
    setApiKey('');
    setStatus('idle');
    alert('API Key eliminada.');
  };

  const handleTest = async () => {
    setStatus('testing');
    const ok = await testApiKey();
    setStatus(ok ? 'success' : 'error');
    if (ok) alert('La API Key funciona correctamente.');
    else alert('Error validando la API Key. Revisa la key o la conexión.');
  };

  const masked = (k: string) => {
    if (!k) return '(sin key)';
    if (k.length <= 8) return k.replace(/.(?=.{2})/g, '*');
    return `${k.slice(0,4)}...${k.slice(-4)}`;
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-sm font-bold text-white mb-2">Gemini API Key 🔑</h3>
      <p className="text-xs text-slate-400 mb-3">Key actual: <span className="font-mono text-slate-200">{masked(keyInput)}</span></p>

      <input
        type="password"
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        placeholder="Introduce la Gemini API Key"
        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mb-3"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold py-2 rounded"
        >Guardar</button>
        <button
          onClick={handleTest}
          className="px-4 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold"
          disabled={!keyInput || status === 'testing'}
        >{status === 'testing' ? 'Probando...' : 'Probar'}</button>
        <button
          onClick={handleClear}
          className="px-4 bg-red-600 hover:bg-red-500 text-white rounded font-semibold"
        >Eliminar</button>
      </div>

      {status === 'success' && <p className="mt-2 text-green-400 text-sm">✅ Key válida</p>}
      {status === 'error' && <p className="mt-2 text-red-400 text-sm">❌ Key inválida</p>}
    </div>
  );
}
