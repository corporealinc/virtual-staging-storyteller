import { motion } from 'motion/react';
import { RefreshCw, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultViewProps {
  originalImage: File;
  stagedImageBase64: string;
  story: string;
  onReset: () => void;
}

export default function ResultView({ originalImage, stagedImageBase64, story, onReset }: ResultViewProps) {
  const originalUrl = URL.createObjectURL(originalImage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto space-y-8 font-lato"
    >
      <div className="text-center">
        <h2 className="text-4xl font-playfair font-bold text-navy mb-2">Your New Space</h2>
        <p className="text-navy/70 text-lg">Here is your virtually staged room.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Before Image */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-navy/60 uppercase tracking-wider">Original</p>
          <div className="rounded overflow-hidden shadow-sm border border-navy/20 aspect-video bg-alabaster">
            <img src={originalUrl} alt="Original" className="w-full h-full object-cover opacity-80" />
          </div>
        </div>

        {/* After Image */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-gold uppercase tracking-wider">Virtually Staged</p>
          <div className="rounded overflow-hidden shadow-xl ring-2 ring-gold aspect-video bg-alabaster relative group">
            <img src={stagedImageBase64} alt="Staged" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                <a 
                  href={stagedImageBase64} 
                  download="staged-room.png"
                  className="bg-alabaster text-navy px-6 py-3 rounded font-bold shadow-lg flex items-center gap-2 hover:bg-white transition-colors uppercase tracking-wide text-sm"
                >
                  <Download className="w-4 h-4 text-gold" /> Download
                </a>
            </div>
          </div>
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
        <h3 className="text-2xl font-playfair font-bold text-navy mb-4">Designer's Vision</h3>
        <div className="prose prose-stone max-w-none text-navy/80 leading-relaxed font-lato text-lg">
          <ReactMarkdown>{story}</ReactMarkdown>
        </div>
      </motion.div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="px-8 py-4 bg-navy hover:bg-navy/90 text-alabaster rounded font-bold transition-colors flex items-center gap-2 shadow-lg uppercase tracking-wide"
        >
          <RefreshCw className="w-5 h-5 text-gold" /> Stage Another Room
        </button>
      </div>
    </motion.div>
  );
}