import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  label?: string;
}

export const AudioPlayer = ({ src, label }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Pause when another player starts playing
  useEffect(() => {
    const handleGlobalPlay = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      if (audioRef.current && target !== audioRef.current) {
        audioRef.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener('play', handleGlobalPlay, true);
    return () => document.removeEventListener('play', handleGlobalPlay, true);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => setPlaying(false);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-black/40 border border-cyan-500/20 rounded-xl">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Play/Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        className="flex-shrink-0 w-9 h-9 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/40 flex items-center justify-center transition-all hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]"
      >
        {playing
          ? <Pause className="w-4 h-4 text-cyan-400" />
          : <Play className="w-4 h-4 text-cyan-400 ml-0.5" />
        }
      </button>

      {/* Label + Progress */}
      <div className="flex-1 min-w-0">
        {label && (
          <div className="text-cyan-400/70 font-mono text-xs mb-1 truncate">
            {label}
          </div>
        )}
        {/* Progress bar */}
        <div
          className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Time */}
      <div className="flex-shrink-0 text-white/40 font-mono text-xs text-right">
        <span className="text-white/70">{fmt(currentTime)}</span>
        {duration > 0 && <span> / {fmt(duration)}</span>}
      </div>
    </div>
  );
};

export default AudioPlayer;
