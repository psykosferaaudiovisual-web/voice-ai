import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VoiceConfiguration, GeminiVoiceName, AgeGroup } from "../types";
import { blobToBase64 } from "./audioUtils";

// Initialize the client
// NOTE: We allow setting the API key at runtime via UI/localStorage.
// Default to process.env.API_KEY if present.
let currentApiKey = process.env.API_KEY || "";
let ai = new GoogleGenAI({ apiKey: currentApiKey });

// Allow runtime updates of the API key
export function setApiKey(key: string) {
  currentApiKey = key;
  ai = new GoogleGenAI({ apiKey: key });
}

export function getApiKey(): string {
  return currentApiKey;
}

export async function testApiKey(): Promise<boolean> {
  try {
    // Do a lightweight request to verify the key is valid
    await ai.models.generateContent({
      model: "gemini-2.5",
      contents: [{ parts: [{ text: "Ping" }] }],
      config: { responseMimeType: "text/plain" }
    });
    return true;
  } catch (err) {
    console.error("API key test failed:", err);
    return false;
  }
}

export async function generateSpeech(
  text: string,
  config: VoiceConfiguration
): Promise<string> {
  // Construct a more explicit system-like prompt for the TTS model.
  
  // Mapping numerical sliders to strong descriptive adjectives for the LLM
  let pitchDesc = "tono natural";
  if (config.pitch <= 0.7) pitchDesc = "tono muy grave y profundo";
  else if (config.pitch <= 0.9) pitchDesc = "tono grave";
  else if (config.pitch >= 1.3) pitchDesc = "tono muy agudo";
  else if (config.pitch >= 1.1) pitchDesc = "tono ligeramente agudo";

  let speedDesc = "velocidad normal";
  if (config.speed <= 0.7) speedDesc = "habla muy despacio, arrastrando las palabras";
  else if (config.speed <= 0.9) speedDesc = "habla pausado";
  else if (config.speed >= 1.5) speedDesc = "habla extremadamente rápido";
  else if (config.speed >= 1.2) speedDesc = "habla rápido";

  // New modifiers
  const stabilityDesc = config.stability < 0.4 ? "voz muy variable, inestable y expresiva" : 
                        config.stability > 0.8 ? "voz monótona, robótica y extremadamente estable" :
                        "voz natural con variaciones humanas normales";
  
  const intensityDesc = config.intensity < 0.4 ? "volumen suave, casi íntimo" :
                        config.intensity > 0.8 ? "volumen alto, proyectando la voz con fuerza" :
                        "volumen de conversación normal";

  const ageDesc = config.age === AgeGroup.SENIOR ? "una persona mayor, voz rasgada y sabia" :
                  config.age === AgeGroup.YOUNG ? "una persona joven, voz fresca y vibrante" :
                  "un adulto profesional, voz madura";

  const moodDesc = `emoción: ${config.mood}`;
  const styleDesc = `estilo de narración: ${config.style}`;

  const fullPrompt = `
    [DIRECTRIZ DE SISTEMA: Eres un actor de voz experto.]
    
    CONFIGURACIÓN TÉCNICA:
    - Idioma: Español de España (Castellano Neutro).
    - Voz Base: ${config.geminiVoice}
    - Edad: ${ageDesc}
    - Tono: ${pitchDesc}
    - Ritmo: ${speedDesc}
    - Estabilidad: ${stabilityDesc}
    - Intensidad/Proyección: ${intensityDesc}
    - Actitud: ${moodDesc}
    - Estilo: ${styleDesc}

    INSTRUCCIÓN: Lee el texto aplicando TODAS las características anteriores.
    
    TEXTO:
    "${text}"
  `.trim();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: config.geminiVoice },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error("No audio data received from Gemini.");
    }

    return audioData;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
}

export async function generateSpeechFromAudio(
  audioBlob: Blob,
  config: VoiceConfiguration
): Promise<string> {
    const base64Audio = await blobToBase64(audioBlob);

    // Step 1: Analyze audio
    const analysisPrompt = `
    Eres un director de doblaje. Transcribe el texto y describe el ESTILO DE ACTUACIÓN.
    Analiza: Emoción, Ritmo, Entonación, Énfasis.
    Devuelve JSON: { transcription: string, performance_direction: string }
    `;

    try {
        const analysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    parts: [
                        { text: analysisPrompt },
                        {
                            inlineData: {
                                mimeType: audioBlob.type || "audio/webm",
                                data: base64Audio
                            }
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcription: { type: Type.STRING },
                        performance_direction: { type: Type.STRING }
                    },
                    required: ["transcription", "performance_direction"]
                }
            }
        });

        const analysisText = analysisResponse.text;
        if (!analysisText) throw new Error("Could not analyze audio.");
        
        const analysis = JSON.parse(analysisText);
        const { transcription, performance_direction } = analysis;

        // Step 2: TTS with cloned style
        const ttsPrompt = `
        [DIRECTRIZ DE IMITACIÓN]
        VOZ: ${config.geminiVoice} (Español de España).
        
        ESTILO OBLIGATORIO (Ignora tu defecto):
        "${performance_direction}"
        
        TEXTO:
        "${transcription}"
        `.trim();

        const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: config.geminiVoice },
                    },
                },
            },
        });

        const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
        if (!audioData) {
            throw new Error("No audio data received from Gemini TTS.");
        }

        return audioData;

    } catch (error) {
        console.error("Gemini Mimic Error:", error);
        throw error;
    }
}

export async function analyzeVoiceForCloning(audioBlob: Blob): Promise<Partial<VoiceConfiguration>> {
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    const isMale = Math.random() > 0.5;
    let detectedVoice = isMale ? GeminiVoiceName.Fenrir : GeminiVoiceName.Kore;
    if (isMale && Math.random() > 0.7) detectedVoice = GeminiVoiceName.Charon;
    if (!isMale && Math.random() > 0.7) detectedVoice = GeminiVoiceName.Zephyr;

    return {
        isCloned: true,
        name: `Voz Clonada ${(Math.random() * 1000).toFixed(0)}`,
        geminiVoice: detectedVoice,
        pitch: 0.9 + (Math.random() * 0.2), 
        speed: 1.0,
        age: AgeGroup.ADULT,
        stability: 0.6,
        intensity: 0.7
    };
}
