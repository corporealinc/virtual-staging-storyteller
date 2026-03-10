import { motion } from 'motion/react';
import { RefreshCw, Download, Volume2, VolumeOff, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useRef, useEffect, useCallback } from 'react';

interface ResultViewProps {
  originalImage: File;
  stagedImageBase64: string;
  story: string;
  onReset: () => void;
}

export default function ResultView({ originalImage, stagedImageBase64, story, onReset }: ResultViewProps) {
  const originalUrl = URL.createObjectURL(originalImage);
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Split story into paragraphs (filter out empty lines)
  const paragraphs = story.split(/\n\n+/).filter((p) => p.trim());

  // Fetch TTS audio on mount
  useEffect(() => {
    // CRITICAL: Don't fetch if AI hasn't passed the story yet
    if (!story || story.trim() === '') return;

    let cancelled = false;
    const fetchAudio = async () => {
      try {
        setAudioError(null);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: story }),
        });
        
        if (!res.ok) throw new Error('TTS failed');
        
        const data = await res.json();
        if (cancelled) return;

        if (data.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
          audio.onended = () => setIsPlaying(false);
          audioRef.current = audio;
          setAudioReady(true);
        } else {
          throw new Error('No audio content returned');
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('TTS fetch error:', e);
          setAudioError(e.message || 'Failed to load audio');
        }
      }
    };
    
    fetchAudio();
    
    return () => { 
      cancelled = true; 
      // Safely cleanup audio if user leaves the page
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [story]);

  // Reveal paragraphs one by one with delay
  useEffect(() => {
    if (visibleParagraphs >= paragraphs.length) return;
    const timer = setTimeout(() => {
      setVisibleParagraphs((v) => v + 1);
    }, visibleParagraphs === 0 ? 600 : 1200);
    return () => clearTimeout(timer);
  }, [visibleParagraphs, paragraphs.length]);

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(e => console.error("Error playing audio:", e));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center">
        <h2 className="text-4xl font-inter font-bold text-navy mb-2">Welcome to Your Dream Home</h2>
        <p className="text-navy/70 text-lg">See how this empty space transforms into a place you'll love to live.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Before Image */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-navy/60 uppercase tracking-wider">Original</p>
          <div className="rounded overflow-hidden shadow-sm border border-navy/20 aspect-video bg-gray-50">
            <img src={originalUrl} alt="Original" className="w-full h-full object-cover opacity-80" />
          </div>
        </div>

        {/* After Image */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-gold uppercase tracking-wider">Virtually Staged</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="rounded overflow-hidden shadow-xl ring-2 ring-gold aspect-video bg-gray-50 relative group"
          >
            <img src={stagedImageBase64} alt="Staged" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                <a 
                  href={stagedImageBase64} 
                  download="staged-room.png"
                  className="bg-gray-50 text-navy px-6 py-3 rounded font-bold shadow-lg flex items-center gap-2 hover:bg-white transition-colors uppercase tracking-wide text-sm"
                >
                  <Download className="w-4 h-4 text-gold" /> Download
                </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Story Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-8 rounded shadow-lg border border-navy/10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-2 h-full bg-gold" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-inter font-bold text-navy">Designer's Vision</h3>
          
          {/* Updated Button to handle Audio Errors */}
          <button
            onClick={toggleAudio}
            disabled={!audioReady || !!audioError}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              audioError 
                ? 'bg-red-50 text-red-500 cursor-not-allowed'
                : !audioReady
                ? 'bg-navy/5 text-navy/30 cursor-wait'
                : isPlaying
                  ? 'bg-gold/20 text-navy ring-1 ring-gold'
                  : 'bg-navy/5 text-navy/70 hover:bg-navy/10 hover:text-navy'
            }`}
          >
            {audioError ? <AlertCircle className="w-4 h-4" /> : isPlaying ? <VolumeOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-gold" />}
            {audioError ? 'Audio Unavailable' : !audioReady ? 'Loading...' : isPlaying ? 'Pause' : 'Listen'}
          </button>

        </div>
        <div className="prose prose-stone max-w-none text-navy/80 leading-relaxed text-lg space-y-4">
          {paragraphs.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={i < visibleParagraphs ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <ReactMarkdown>{p}</ReactMarkdown>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="px-8 py-4 bg-navy hover:bg-navy/90 text-white rounded font-bold transition-colors flex items-center gap-2 shadow-lg uppercase tracking-wide"
        >
          <RefreshCw className="w-5 h-5 text-gold" /> Stage Another Room
        </button>
      </div>
    </motion.div>
  );
}