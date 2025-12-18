import React, { useState, useRef } from 'react';

interface MimicPanelProps {
    onMimic: (audioBlob: Blob) => void;
    isGenerating: boolean;
}

const MimicPanel: React.FC<MimicPanelProps> = ({ onMimic, isGenerating }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordedBlob(null); // Clear previous
        } catch (err) {
            console.error("Mic Error:", err);
            alert("Error accediendo al micrófono.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setRecordedBlob(e.target.files[0]);
        }
    };

    const handleAction = () => {
        if (recordedBlob) {
            onMimic(recordedBlob);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Imitar Audio (Speech-to-Speech)
            </h3>
            
            <p className="text-slate-400 text-sm">
                Graba o sube un audio. La IA repetirá lo que digas usando la voz seleccionada en el panel izquierdo, pero copiando tu entonación, pausas y velocidad.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center hover:border-indigo-500 transition-colors cursor-pointer relative bg-slate-900/50">
                    <input 
                        type="file" 
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-slate-300 font-medium">Subir Audio Fuente</span>
                    <span className="text-xs text-slate-500">WAV, MP3, WebM</span>
                </div>

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`rounded-lg p-6 flex flex-col items-center justify-center transition-all ${
                        isRecording 
                        ? 'bg-red-500/10 border-2 border-red-500 text-red-400 animate-pulse' 
                        : 'border-2 border-slate-600 hover:border-red-500 text-slate-300 bg-slate-900/50'
                    }`}
                >
                     {isRecording ? (
                         <div className="flex flex-col items-center">
                            <span className="font-bold text-red-500 mb-1">DETENER</span>
                            <span className="text-xs">Grabando...</span>
                         </div>
                    ) : (
                        <>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="font-medium">Grabar Voz Fuente</span>
                        </>
                    )}
                </button>
            </div>

            {recordedBlob && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Audio listo para procesar</p>
                            <p className="text-xs text-indigo-300">{(recordedBlob.size / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleAction}
                        disabled={isGenerating}
                        className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                            isGenerating
                            ? 'bg-slate-600 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}
                    >
                         {isGenerating ? (
                             <span>Procesando...</span>
                         ) : (
                             <span>Imitar con IA</span>
                         )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MimicPanel;