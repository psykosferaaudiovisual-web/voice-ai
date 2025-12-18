import React, { useState, useRef } from 'react';
import { analyzeVoiceForCloning } from '../services/geminiService';
import { VoiceConfiguration } from '../types';

interface CloningPanelProps {
    onCloningComplete: (partialConfig: Partial<VoiceConfiguration>) => void;
}

const CloningPanel: React.FC<CloningPanelProps> = ({ onCloningComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await processAudio(blob);
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            setError("No se pudo acceder al micrófono.");
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processAudio(e.target.files[0]);
        }
    };

    const processAudio = async (blob: Blob) => {
        setIsProcessing(true);
        try {
            const result = await analyzeVoiceForCloning(blob);
            onCloningComplete(result);
        } catch (err) {
            setError("Error al procesar el audio.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Clonación de Voz
            </h3>
            
            <p className="text-slate-400 text-sm mb-6">
                Sube una muestra de audio (min 10s) o graba tu voz para generar un perfil personalizado.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-slate-300 font-medium">Subir Audio</span>
                    <span className="text-xs text-slate-500">MP3, WAV, M4A</span>
                </div>

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`rounded-lg p-6 flex flex-col items-center justify-center transition-all ${
                        isRecording 
                        ? 'bg-red-500/10 border-2 border-red-500 text-red-400 animate-pulse' 
                        : 'border-2 border-slate-600 hover:border-red-500 text-slate-300'
                    }`}
                >
                    {isRecording ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" viewBox="0 0 20 20" fill="currentColor">
                             <rect x="6" y="6" width="8" height="8" rx="1" />
                         </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                    <span className="font-medium">{isRecording ? 'Detener Grabación' : 'Grabar con Micrófono'}</span>
                    {isRecording && <span className="text-xs">Grabando...</span>}
                </button>
            </div>

            {isProcessing && (
                <div className="mt-4 flex items-center gap-3 text-blue-400 bg-blue-500/10 p-3 rounded-lg">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analizando características vocales y generando modelo...</span>
                </div>
            )}
             {error && (
                <div className="mt-4 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};

export default CloningPanel;