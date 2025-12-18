export const SAMPLE_RATE = 24000;

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  base64Data: string,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const bytes = decodeBase64(base64Data);
  
  // Gemini returns raw PCM 16-bit integers
  const dataInt16 = new Int16Array(bytes.buffer);
  
  // Create buffer: 1 channel (mono), correct length, sample rate
  const buffer = ctx.createBuffer(1, dataInt16.length, SAMPLE_RATE);
  const channelData = buffer.getChannelData(0);

  // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  return buffer;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}