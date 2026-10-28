'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Play,
  Pause,
  CloudRain,
  Wind,
  Moon,
  CloudLightning,
  SunMedium,
  Snowflake,
  X,
} from 'lucide-react';

export type AmbientSoundPreset =
  | 'auto'
  | 'calm'
  | 'rain'
  | 'wind'
  | 'night'
  | 'thunder'
  | 'blizzard';

interface AmbientSoundEngineProps {
  weatherId?: number;
  isNight?: boolean;
  windSpeedKmh?: number;
  lang?: 'id' | 'en';
}

export const AmbientSoundEngine: React.FC<AmbientSoundEngineProps> = ({
  weatherId = 800,
  isNight = false,
  windSpeedKmh = 10,
  lang = 'id',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.45);
  const [preset, setPreset] = useState<AmbientSoundPreset>('auto');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const nightGainRef = useRef<GainNode | null>(null);
  const thunderGainRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const dropIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cricketIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thunderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const birdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Resolve active acoustic profile
  const resolvedMode = useCallback(():
    | 'rain'
    | 'wind'
    | 'night'
    | 'thunder'
    | 'calm'
    | 'blizzard' => {
    if (preset === 'calm') return 'calm';
    if (preset === 'rain') return 'rain';
    if (preset === 'wind') return 'wind';
    if (preset === 'night') return 'night';
    if (preset === 'thunder') return 'thunder';
    if (preset === 'blizzard') return 'blizzard';

    // Auto sync with real-time city condition
    if (weatherId >= 200 && weatherId < 300) return 'thunder';
    if (weatherId === 511 || (weatherId >= 600 && weatherId < 700)) return 'blizzard';
    if (weatherId >= 300 && weatherId < 600) return 'rain';
    if (windSpeedKmh > 24) return 'wind';
    if (isNight) return 'night';
    return 'calm';
  }, [preset, weatherId, isNight, windSpeedKmh]);

  // Create Pink Noise Buffer for authentic organic rain & wind
  const createPinkNoiseBuffer = (ctx: AudioContext, seconds = 4): AudioBuffer => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  };

  // Safe Audio Initialization
  const setupAudioContext = async () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const pinkBuffer = createPinkNoiseBuffer(ctx, 5);

      // --- 1. Rain Synthesizer ---
      const rainSource = ctx.createBufferSource();
      rainSource.buffer = pinkBuffer;
      rainSource.loop = true;

      const rainLowpass = ctx.createBiquadFilter();
      rainLowpass.type = 'lowpass';
      rainLowpass.frequency.setValueAtTime(2200, ctx.currentTime);

      const rainHighpass = ctx.createBiquadFilter();
      rainHighpass.type = 'highpass';
      rainHighpass.frequency.setValueAtTime(240, ctx.currentTime);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0, ctx.currentTime);

      rainSource.connect(rainLowpass);
      rainLowpass.connect(rainHighpass);
      rainHighpass.connect(rainGain);
      rainGain.connect(masterGain);
      rainSource.start(0);
      rainGainRef.current = rainGain;

      // --- 2. Wind Synthesizer (Resonant Filter + LFO) ---
      const windSource = ctx.createBufferSource();
      windSource.buffer = pinkBuffer;
      windSource.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(360, ctx.currentTime);
      windFilter.Q.setValueAtTime(2.2, ctx.currentTime);

      const windLfo = ctx.createOscillator();
      windLfo.frequency.setValueAtTime(0.18, ctx.currentTime); // slow organic wave
      const windLfoGain = ctx.createGain();
      windLfoGain.gain.setValueAtTime(200, ctx.currentTime);

      windLfo.connect(windLfoGain);
      windLfoGain.connect(windFilter.frequency);
      windLfo.start(0);

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0, ctx.currentTime);

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(masterGain);
      windSource.start(0);
      windGainRef.current = windGain;

      // --- 3. Night Warm Drone Synthesizer ---
      const nightOsc = ctx.createOscillator();
      nightOsc.type = 'triangle';
      nightOsc.frequency.setValueAtTime(95, ctx.currentTime);

      const nightFilter = ctx.createBiquadFilter();
      nightFilter.type = 'lowpass';
      nightFilter.frequency.setValueAtTime(180, ctx.currentTime);

      const nightGain = ctx.createGain();
      nightGain.gain.setValueAtTime(0, ctx.currentTime);

      nightOsc.connect(nightFilter);
      nightFilter.connect(nightGain);
      nightGain.connect(masterGain);
      nightOsc.start(0);
      nightGainRef.current = nightGain;

      // --- 4. Distant Thunder Path ---
      const thunderGain = ctx.createGain();
      thunderGain.gain.setValueAtTime(0, ctx.currentTime);
      thunderGain.connect(masterGain);
      thunderGainRef.current = thunderGain;

      noiseSourceRef.current = rainSource;
    }

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  };

  // Play a water droplet ping
  const triggerWaterDrop = useCallback(() => {
    if (!audioCtxRef.current || !isPlaying) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = 1100 + Math.random() * 700;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      if (masterGainRef.current) gain.connect(masterGainRef.current);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Ignore audio interruption
    }
  }, [isPlaying]);

  // Play a crisp cricket chirp
  const triggerCricket = useCallback(() => {
    if (!audioCtxRef.current || !isPlaying) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = 4600 + (Math.random() - 0.5) * 250;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      if (masterGainRef.current) gain.connect(masterGainRef.current);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // Ignore
    }
  }, [isPlaying]);

  // Distant thunder rumble
  const triggerThunder = useCallback(() => {
    if (!audioCtxRef.current || !isPlaying) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 1.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      if (masterGainRef.current) gain.connect(masterGainRef.current);

      osc.start();
      osc.stop(ctx.currentTime + 1.9);
    } catch {
      // Ignore
    }
  }, [isPlaying]);

  // Sweet melodious nature bird chirp warble
  const triggerBirdChirp = useCallback(() => {
    if (!audioCtxRef.current || !isPlaying) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;

    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 2600 + Math.random() * 400;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t0);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t0 + 0.04);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, t0 + 0.09);
      osc.frequency.setValueAtTime(baseFreq * 1.1, t0 + 0.12);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, t0 + 0.16);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, t0 + 0.22);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.09, t0 + 0.03);
      gain.gain.linearRampToValueAtTime(0.01, t0 + 0.10);
      gain.gain.linearRampToValueAtTime(0.08, t0 + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);

      osc.connect(gain);
      if (masterGainRef.current) gain.connect(masterGainRef.current);

      osc.start(t0);
      osc.stop(t0 + 0.25);
    } catch {
      // Ignore
    }
  }, [isPlaying]);

  // Adjust volume gains smoothly when playing & mode changes
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const active = isPlaying;
    const mode = resolvedMode();

    if (rainGainRef.current) {
      const target = active ? (mode === 'rain' ? 0.55 : mode === 'thunder' ? 0.65 : 0) : 0;
      rainGainRef.current.gain.cancelScheduledValues(now);
      rainGainRef.current.gain.setTargetAtTime(target, now, 0.2);
    }

    if (windGainRef.current) {
      const target = active
        ? mode === 'blizzard'
          ? 0.78
          : mode === 'wind'
            ? 0.65
            : mode === 'thunder'
              ? 0.45
              : mode === 'calm'
                ? 0.28
                : 0.12
        : 0;
      windGainRef.current.gain.cancelScheduledValues(now);
      windGainRef.current.gain.setTargetAtTime(target, now, 0.2);
    }

    if (nightGainRef.current) {
      const target = active ? (mode === 'night' ? 0.35 : mode === 'blizzard' ? 0.2 : 0) : 0;
      nightGainRef.current.gain.cancelScheduledValues(now);
      nightGainRef.current.gain.setTargetAtTime(target, now, 0.2);
    }

    // Interval timers for random micro-impulses
    if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    if (cricketIntervalRef.current) clearInterval(cricketIntervalRef.current);
    if (thunderIntervalRef.current) clearInterval(thunderIntervalRef.current);
    if (birdIntervalRef.current) clearInterval(birdIntervalRef.current);

    if (active) {
      if (mode === 'calm') {
        birdIntervalRef.current = setInterval(() => {
          if (Math.random() > 0.4) triggerBirdChirp();
        }, 3000);
      }
      if (mode === 'rain' || mode === 'thunder' || mode === 'blizzard') {
        dropIntervalRef.current = setInterval(() => {
          if (Math.random() > (mode === 'blizzard' ? 0.55 : 0.35)) triggerWaterDrop();
        }, mode === 'blizzard' ? 420 : 280);
      }
      if (mode === 'thunder') {
        thunderIntervalRef.current = setInterval(() => {
          if (Math.random() > 0.6) triggerThunder();
        }, 5000);
      }
      if (mode === 'night') {
        cricketIntervalRef.current = setInterval(() => {
          if (Math.random() > 0.4) triggerCricket();
        }, 550);
      }
    }

    return () => {
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
      if (cricketIntervalRef.current) clearInterval(cricketIntervalRef.current);
      if (thunderIntervalRef.current) clearInterval(thunderIntervalRef.current);
      if (birdIntervalRef.current) clearInterval(birdIntervalRef.current);
    };
  }, [isPlaying, resolvedMode, triggerWaterDrop, triggerCricket, triggerThunder, triggerBirdChirp]);

  // Master volume slider change
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current && isPlaying) {
      const ctx = audioCtxRef.current;
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }
  }, [volume, isPlaying]);

  // Start sound with guaranteed audio context
  const startAudio = async () => {
    const ctx = await setupAudioContext();
    if (!ctx) return;
    if (masterGainRef.current) {
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setValueAtTime(volume, ctx.currentTime);
    }
    setIsPlaying(true);
  };

  // Stop sound
  const stopAudio = () => {
    if (masterGainRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    }
    setIsPlaying(false);
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      stopAudio();
    } else {
      await startAudio();
    }
  };

  // When clicking a preset button in the popover: activate preset AND start sound immediately!
  const handleSelectPreset = async (selected: AmbientSoundPreset) => {
    setPreset(selected);
    if (!isPlaying) {
      await startAudio();
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const activeMode = resolvedMode();
  const presetLabels: Record<string, { id: string; en: string }> = {
    auto: { id: 'Sinkron Cuaca', en: 'Auto Sync' },
    calm: { id: 'Alam Damai', en: 'Peaceful Nature' },
    rain: { id: 'Hujan Rintik', en: 'Gentle Rain' },
    wind: { id: 'Angin Sepoi', en: 'Gentle Breeze' },
    night: { id: 'Malam Damai', en: 'Peaceful Night' },
    thunder: { id: 'Badai Petir', en: 'Thunderstorm' },
    blizzard: { id: 'Badai Salju', en: 'Arctic Blizzard' },
  };

  return (
    <div className="ambient-sound-engine" ref={popoverRef}>
      {/* Split Control Pill: Left side Play/Pause, Right side Settings Modal */}
      <div className={`ambient-control-group ${isPlaying ? 'is-playing' : ''}`}>
        <button
          type="button"
          className="ambient-play-btn"
          onClick={handleTogglePlay}
          title={
            isPlaying
              ? lang === 'id'
                ? 'Jeda Suara Atmosfer'
                : 'Pause Ambient Sound'
              : lang === 'id'
              ? 'Putar Suara Cuaca Organik'
              : 'Play Organic Weather Sound'
          }
          aria-label="Toggle Ambient Audio"
        >
          {isPlaying ? (
            <span className="soundwave-anim">
              <span className="sw-bar bar-1"></span>
              <span className="sw-bar bar-2"></span>
              <span className="sw-bar bar-3"></span>
              <span className="sw-bar bar-4"></span>
            </span>
          ) : (
            <VolumeX size={15} className="audio-off-icon" />
          )}
          <span className="ambient-play-label">
            {isPlaying
              ? (preset === 'auto' ? presetLabels[activeMode]?.[lang] : presetLabels[preset]?.[lang]) || (lang === 'id' ? 'Aktif' : 'Active')
              : lang === 'id'
              ? 'Suara Alami'
              : 'Soundscape'}
          </span>
        </button>

        <button
          type="button"
          className={`ambient-settings-btn ${isOpen ? 'active-open' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          title={lang === 'id' ? 'Buka Pengaturan Suara Alami' : 'Open Soundscape Settings'}
          aria-label="Soundscape Settings"
        >
          <Sliders size={13} />
        </button>
      </div>

      {/* Settings Modal Popover */}
      {isOpen && (
        <div className="ambient-audio-popover glass-card">
          <div className="audio-popover-header">
            <div className="popover-title-row">
              <Volume2 size={16} color="#38bdf8" />
              <h4>{lang === 'id' ? 'Pengaturan Suara Alami' : 'Ambient Soundscape'}</h4>
            </div>
            <button
              type="button"
              className="popover-close-btn"
              onClick={() => setIsOpen(false)}
              title={lang === 'id' ? 'Tutup' : 'Close'}
            >
              <X size={14} />
            </button>
          </div>

          <p className="popover-desc">
            {lang === 'id'
              ? 'Suara atmosfer disintesis organik di browsermu secara real-time.'
              : 'Procedural soundscapes synthesized in real time via Web Audio API.'}
          </p>

          {/* Volume Slider Control */}
          <div className="audio-volume-control">
            <div className="volume-label-row">
              <span className="vol-text">
                {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {lang === 'id' ? 'Volume Suara' : 'Volume'}
              </span>
              <span className="vol-pct">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (!isPlaying && val > 0) {
                  void startAudio();
                }
              }}
              className="audio-volume-slider"
              aria-label="Volume Slider"
            />
          </div>

          {/* Preset Buttons Grid */}
          <div className="audio-presets-section">
            <span className="presets-title">{lang === 'id' ? 'Pilih Suasana Cuaca' : 'Select Atmosphere'}</span>
            <div className="presets-grid">
              <button
                type="button"
                className={`preset-btn ${preset === 'auto' ? 'active' : ''}`}
                onClick={() => void handleSelectPreset('auto')}
              >
                <Sparkles size={14} color="#facc15" />
                <span>{lang === 'id' ? 'Sinkron Cuaca' : 'Auto Sync'}</span>
              </button>

              <button
                type="button"
                className={`preset-btn ${preset === 'calm' ? 'active' : ''}`}
                onClick={() => void handleSelectPreset('calm')}
              >
                <SunMedium size={14} color="#f59e0b" />
                <span>{lang === 'id' ? 'Alam Damai' : 'Peaceful Nature'}</span>
              </button>

              <button
                type="button"
                className={`preset-btn ${preset === 'rain' ? 'active' : ''}`}
                onClick={() => void handleSelectPreset('rain')}
              >
                <CloudRain size={14} color="#38bdf8" />
                <span>{lang === 'id' ? 'Hujan Rintik' : 'Gentle Rain'}</span>
              </button>

              <button
                type="button"
                className={`preset-btn ${preset === 'wind' ? 'active' : ''}`}
                onClick={() => void handleSelectPreset('wind')}
              >
                <Wind size={14} color="#34d399" />
                <span>{lang === 'id' ? 'Angin Sepoi' : 'Wind Breeze'}</span>
              </button>

              <button
                type="button"
                className={`preset-btn ${preset === 'night' ? 'active' : ''}`}
                onClick={() => void handleSelectPreset('night')}
              >
                <Moon size={14} color="#c084fc" />
                <span>{lang === 'id' ? 'Malam Damai' : 'Peaceful Night'}</span>
              </button>

              <button
                type="button"
                className={`preset-btn ${preset === 'thunder' ? 'active' : ''}`}
                onClick={() => void handleSelectPreset('thunder')}
              >
                <CloudLightning size={14} color="#fbbf24" />
                <span>{lang === 'id' ? 'Badai Petir' : 'Thunderstorm'}</span>
              </button>

              <button
                type="button"
                className={`preset-btn ${preset === 'blizzard' ? 'active' : ''}`}
                onClick={() => void handleSelectPreset('blizzard')}
              >
                <Snowflake size={14} color="#bae6fd" />
                <span>{lang === 'id' ? 'Badai Salju' : 'Arctic Blizzard'}</span>
              </button>
            </div>
          </div>

          {/* Big Master Toggle Play / Pause */}
          <button
            type="button"
            className={`audio-main-toggle ${isPlaying ? 'pause' : 'play'}`}
            onClick={handleTogglePlay}
          >
            {isPlaying ? (
              <>
                <Pause size={15} />
                <span>{lang === 'id' ? 'Jeda Suara Alami' : 'Pause Sound'}</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>{lang === 'id' ? 'Mulai Putar Suara Alami' : 'Play Sound'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
