import React, { useEffect, useRef } from 'react';
import { EqualizerSettings, PostProcessingSettings } from '../types';

interface EqualizerPanelProps {
    settings: EqualizerSettings;
    postSettings: PostProcessingSettings;
    onUpdateEQ: (newSettings: EqualizerSettings) => void;
    onUpdatePost: (newSettings: PostProcessingSettings) => void;
    analyserNode: AnalyserNode | null;
}

const EqualizerPanel: React.FC<EqualizerPanelProps> = ({ settings, postSettings, onUpdateEQ, onUpdatePost, analyserNode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    const updateBand = (band: keyof EqualizerSettings, value: string) => {
        onUpdateEQ({ ...settings, [band]: parseFloat(value) });
    };

    const updatePost = (key: keyof PostProcessingSettings, value: string) => {
        onUpdatePost({ ...postSettings, [key]: parseFloat(value) });
    };

    // Visualizer Loop
    useEffect(() => {
        const draw = () => {
            if (!canvasRef.current || !analyserNode) {
                 animationRef.current = requestAnimationFrame(draw);
                 return;
            }

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Gradient Bars
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#4f46e5'); // Indigo
            gradient.addColorStop(0.5, '#a855f7'); // Purple
            gradient.addColorStop(1, '#ec4899'); // Pink
            ctx.fillStyle = gradient;

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [analyserNode]);

    return (
        <div className="bg-slate-900 border-t border-slate-700 p-4 shadow-2xl">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Visualizer */}
                <div className="md:col-span-3 h-32 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden">
                    <canvas ref={canvasRef} width={300} height={128} className="w-full h-full" />
                    <div className="absolute top-2 left-2 text-xs text-slate-500 font-mono">ANALIZADOR</div>
                </div>

                {/* Post Production Controls (Pitch/Speed) */}
                 <div className="md:col-span-3 space-y-3 bg-slate-800 p-3 rounded-lg">
                    <h3 className="text-xs font-bold text-slate-300 uppercase">Modificadores de Voz</h3>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Velocidad</span>
                            <span className="text-purple-400">{postSettings.playbackRate.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={postSettings.playbackRate}
                            onChange={(e) => updatePost('playbackRate', e.target.value)}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Tono (Afinación)</span>
                            <span className="text-purple-400">{postSettings.detune} cts</span>
                        </div>
                        <input
                            type="range"
                            min="-1200"
                            max="1200"
                            step="100"
                            value={postSettings.detune}
                            onChange={(e) => updatePost('detune', e.target.value)}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                    <button 
                         onClick={() => onUpdatePost({ playbackRate: 1.0, detune: 0 })}
                         className="text-[10px] text-slate-500 hover:text-white underline w-full text-right"
                    >
                        Resetear
                    </button>
                 </div>

                {/* EQ Controls */}
                <div className="md:col-span-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-white flex gap-2 items-center">
                            Ecualizador Gráfico
                        </h3>
                        <button 
                            onClick={() => onUpdateEQ({ low: 0, midLow: 0, mid: 0, midHigh: 0, high: 0 })}
                            className="text-xs text-slate-400 hover:text-white underline"
                        >
                            Reset EQ
                        </button>
                    </div>
                    
                    <div className="flex gap-4 justify-between bg-slate-800 p-4 rounded-lg">
                        {[
                            { label: '60Hz', key: 'low' },
                            { label: '250Hz', key: 'midLow' },
                            { label: '1kHz', key: 'mid' },
                            { label: '4kHz', key: 'midHigh' },
                            { label: '12kHz', key: 'high' },
                        ].map((band) => (
                            <div key={band.key} className="flex flex-col items-center gap-2 flex-1">
                                <input
                                    type="range"
                                    min="-12"
                                    max="12"
                                    step="1"
                                    orient="vertical"
                                    value={settings[band.key as keyof EqualizerSettings]}
                                    onChange={(e) => updateBand(band.key as keyof EqualizerSettings, e.target.value)}
                                    className="h-20 w-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 vertical-slider"
                                    style={{ WebkitAppearance: 'slider-vertical' }}
                                />
                                <span className="text-[10px] text-slate-400 uppercase">{band.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EqualizerPanel;
