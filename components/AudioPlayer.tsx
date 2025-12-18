import React, { useEffect, useRef, useState } from 'react';
import { GeneratedAudio, EqualizerSettings, PostProcessingSettings } from '../types';

interface AudioPlayerProps {
    item: GeneratedAudio;
    onDelete: (id: string) => void;
    getAudioContext: () => AudioContext;
    eqSettings: EqualizerSettings;
    postSettings: PostProcessingSettings;
    setAnalyser: (node: AnalyserNode | null) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ item, onDelete, getAudioContext, eqSettings, postSettings, setAnalyser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Nodes
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const filtersRef = useRef<BiquadFilterNode[]>([]);
    
    // Playback State
    const offsetRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    const setupAudioChain = (ctx: AudioContext, source: AudioBufferSourceNode) => {
        // Create EQ Filters
        const frequencies = [60, 250, 1000, 4000, 12000];
        const gains = [eqSettings.low, eqSettings.midLow, eqSettings.mid, eqSettings.midHigh, eqSettings.high];
        const filters: BiquadFilterNode[] = [];

        let previousNode: AudioNode = source;

        frequencies.forEach((freq, i) => {
            const filter = ctx.createBiquadFilter();
            if (i === 0) filter.type = 'lowshelf';
            else if (i === frequencies.length - 1) filter.type = 'highshelf';
            else filter.type = 'peaking';
            
            filter.frequency.value = freq;
            filter.gain.value = gains[i];
            
            previousNode.connect(filter);
            previousNode = filter;
            filters.push(filter);
        });
        
        filtersRef.current = filters;

        // Analyser
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        previousNode.connect(analyser);
        
        // Expose analyser to parent for global visualization
        setAnalyser(analyser);

        // Destination
        analyser.connect(ctx.destination);
    };

    // Update Post Processing on the fly
    useEffect(() => {
        if (sourceRef.current) {
            // Apply live updates
            sourceRef.current.playbackRate.setValueAtTime(postSettings.playbackRate, getAudioContext().currentTime);
            sourceRef.current.detune.setValueAtTime(postSettings.detune, getAudioContext().currentTime);
        }
    }, [postSettings]);

    // Dynamic EQ Update while playing
    useEffect(() => {
        if (filtersRef.current.length === 5) {
            const gains = [eqSettings.low, eqSettings.midLow, eqSettings.mid, eqSettings.midHigh, eqSettings.high];
            filtersRef.current.forEach((f, i) => {
                f.gain.setTargetAtTime(gains[i], getAudioContext().currentTime, 0.1);
            });
        }
    }, [eqSettings]);

    const play = async () => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();

        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e) {}
        }

        const source = ctx.createBufferSource();
        source.buffer = item.audioBuffer;
        
        // Apply initial Post Settings
        source.playbackRate.value = postSettings.playbackRate;
        source.detune.value = postSettings.detune;

        setupAudioChain(ctx, source);

        source.onended = () => {
            setIsPlaying(false);
            offsetRef.current = 0;
            setAnalyser(null);
        };

        source.start(0, offsetRef.current);
        startTimeRef.current = ctx.currentTime - offsetRef.current;
        sourceRef.current = source;
        setIsPlaying(true);
    };

    const stop = () => {
        if (sourceRef.current) {
            try {
                sourceRef.current.stop();
            } catch(e) {}
            sourceRef.current = null;
        }
        setIsPlaying(false);
        offsetRef.current = 0;
        setAnalyser(null);
    };

    useEffect(() => {
        if (canvasRef.current && item.audioBuffer) {
            drawWaveform(item.audioBuffer, canvasRef.current);
        }
        return () => {
            if (sourceRef.current) try { sourceRef.current.stop(); } catch(e) {}
        };
    }, [item]);

    const drawWaveform = (buffer: AudioBuffer, canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#6366f1'; 
        ctx.beginPath();

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[i * step + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
    };

    const downloadAudio = () => {
        const buffer = item.audioBuffer;
        const wavBlob = audioBufferToWav(buffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `voxclon-${item.id}.wav`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    };
    
    function audioBufferToWav(buffer: AudioBuffer) {
        const numChannels = 1;
        const sampleRate = buffer.sampleRate;
        const format = 1; 
        const bitDepth = 16;
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const data = buffer.getChannelData(0);
        const bufferLength = data.length * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const wavDataByteLength = 44 + bufferLength;
        const header = new ArrayBuffer(44);
        const view = new DataView(header);
        
        function writeString(view: DataView, offset: number, string: string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + bufferLength, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, bufferLength, true);
        
        const wavBuffer = new Uint8Array(wavDataByteLength);
        wavBuffer.set(new Uint8Array(header), 0);
        
        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            const s = Math.max(-1, Math.min(1, data[i]));
            const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
            wavBuffer[offset] = val & 0xFF;
            wavBuffer[offset + 1] = (val >> 8) & 0xFF;
            offset += 2;
        }
        return new Blob([wavBuffer], { type: 'audio/wav' });
    }

    // Wrap delete in a handler that stops propagation just in case
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(item.id);
    }

    return (
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 flex flex-col gap-3 group relative transition-all hover:bg-slate-700/50">
            <div className="flex justify-between items-center">
                <div className="text-sm text-slate-300 font-medium truncate max-w-[60%]">
                    {item.text}
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 font-mono">
                        {item.timestamp.toLocaleTimeString()}
                    </span>
                    <button 
                        onClick={handleDeleteClick}
                        className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-full transition-colors z-10"
                        title="Eliminar Audio"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <canvas 
                ref={canvasRef} 
                width={300} 
                height={48} 
                className="w-full h-12 bg-slate-900/50 rounded opacity-60"
            />

            <div className="flex gap-2">
                <button 
                    onClick={isPlaying ? stop : play}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-colors flex justify-center items-center gap-2 ${
                        isPlaying 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-600 hover:bg-slate-500 text-white'
                    }`}
                >
                     {isPlaying ? (
                         <>Detener</>
                     ) : (
                         <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Reproducir
                         </>
                     )}
                </button>
                <button 
                    onClick={downloadAudio}
                    className="px-4 bg-slate-600 hover:bg-emerald-600 text-white rounded-md transition-colors flex items-center gap-2 text-xs font-bold"
                    title="Descargar WAV"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    DESCARGAR
                </button>
            </div>
        </div>
    );
};

export default AudioPlayer;