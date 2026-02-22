import { useEffect, useRef, useState } from 'react';
import { type NoteName, NOTES } from '../utils/musicTheory';

// Constants for pitch detection
const MIN_FREQ = 80; // Low E2 is ~82Hz
const MAX_FREQ = 1000; // High C6 is ~1046Hz
const BUFFER_SIZE = 2048;

interface PitchResult {
  frequency: number;
  note: NoteName;
  octave: number;
  cents: number; // Deviation from the perfect note in cents (-50 to +50)
  clarity: number; // Confidence of the pitch detection (0-1)
}

export const usePitchDetector = () => {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);

  // Simple autocorrelation algorithm
  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
    let size = buffer.length;
    let rms = 0;
    
    // Calculate Root Mean Square to check signal level
    for (let i = 0; i < size; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return -1; // Signal too low (silence)

    // Clip the buffer for better correlation
    let r1 = 0, r2 = size - 1;
    const threshold = 0.2;
    for (let i = 0; i < size / 2; i++) {
        if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
    }
    for (let i = 1; i < size / 2; i++) {
        if (Math.abs(buffer[size - i]) < threshold) { r2 = size - i; break; }
    }
    
    buffer = buffer.slice(r1, r2);
    size = buffer.length;

    const c = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size - i; j++) {
            c[i] = c[i] + buffer[j] * buffer[j + i];
        }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    
    for (let i = d; i < size; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    
    let T0 = maxpos;
    
    // Parabolic interpolation for better precision
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  const getNoteFromFreq = (frequency: number): { note: NoteName, octave: number, cents: number } => {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const midiNum = Math.round(noteNum) + 69;
    
    const octave = Math.floor(midiNum / 12) - 1;
    const noteIndex = midiNum % 12;
    const note = NOTES[noteIndex]; // NOTES needs to be imported, likely re-ordered to start with C=0? 
    // Wait, in musicTheory.ts: NOTES = ["C", "C#", ...]. MIDI 60 is C4. 60 % 12 = 0 -> C. Correct.

    const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
    
    return { note, octave, cents };
  };

  const updatePitch = () => {
    if (!analyserRef.current) return;
    
    const buffer = new Float32Array(BUFFER_SIZE);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const frequency = autoCorrelate(buffer, audioContextRef.current!.sampleRate);
    
    if (frequency > MIN_FREQ && frequency < MAX_FREQ) {
        const { note, octave, cents } = getNoteFromFreq(frequency);
        setPitch({ frequency, note, octave, cents, clarity: 1 }); // Simplified clarity
    } else {
        setPitch(null); // No valid pitch detected
    }
    
    requestRef.current = requestAnimationFrame(updatePitch);
  };

  const start = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = BUFFER_SIZE * 2; // Needs to be power of 2
        
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        
        setIsListening(true);
        updatePitch();
    } catch (err) {
        console.error("Error accessing microphone:", err);
    }
  };

  const stop = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsListening(false);
    setPitch(null);
  };

  useEffect(() => {
    return () => {
        if (isListening) stop();
    };
  }, []);

  return { isListening, pitch, start, stop };
};
