import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, Upload, Sparkles, Loader2 } from 'lucide-react';

interface StagingToolProps {
  onSubmit: (image: File, style: string) => void;
  isProcessing: boolean;
}

const PRESET_STYLES = [
  "Modern Farmhouse",
  "Scandinavian Minimalist",
  "Industrial Loft",
  "Mid-Century Modern",
  "Coastal Breeze",
  "Traditional Luxury"
];

export default function StagingTool({ onSubmit, isProcessing }: StagingToolProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedImage && style) {
      onSubmit(selectedImage, style);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl mx-auto space-y-8 font-lato"
    >
      <div className="text-center">
        <h2 className="text-4xl font-playfair font-bold text-navy mb-2">Stage This Room</h2>
        <p className="text-navy/70 text-lg">Take a photo and choose a style to transform the space.</p>
      </div>

      {/* Image Upload Area */}
      <div className="bg-white p-6 rounded shadow-sm border border-navy/10">
        {!previewUrl ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-navy/20 rounded p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-alabaster transition-colors group"
          >
            <div className="w-16 h-16 bg-alabaster rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Camera className="w-8 h-8 text-gold" />
            </div>
            <div className="text-center">
              <p className="font-bold text-navy text-lg">Tap to take a photo</p>
              <p className="text-sm text-navy/60">or upload from gallery</p>
            </div>
          </div>
        ) : (
          <div className="relative rounded overflow-hidden aspect-video bg-alabaster shadow-inner">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => {
                setSelectedImage(null);
                setPreviewUrl(null);
              }}
              className="absolute top-4 right-4 bg-navy/80 hover:bg-navy text-alabaster p-3 rounded-full backdrop-blur-sm transition-colors shadow-lg"
            >
              <Upload className="w-5 h-5" />
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Style Selection */}
      <div className="bg-white p-6 rounded shadow-sm border border-navy/10 space-y-4">
        <label className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-gold" /> Choose a Style
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESET_STYLES.map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`px-4 py-3 rounded text-sm font-bold transition-all border ${
                style === s
                  ? 'bg-gold/10 border-gold text-navy ring-1 ring-gold'
                  : 'bg-white border-navy/20 text-navy/70 hover:border-gold hover:text-navy'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Or type your own vision..."
            className="w-full px-4 py-3 bg-alabaster rounded border border-navy/20 focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedImage || !style || isProcessing}
        className={`w-full py-4 rounded font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg uppercase tracking-wide ${
          !selectedImage || !style || isProcessing
            ? 'bg-navy/10 text-navy/40 cursor-not-allowed shadow-none'
            : 'bg-navy hover:bg-navy/90 text-alabaster'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            Designing your room...
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6 text-gold" />
            Stage My Room
          </>
        )}
      </button>
    </motion.div>
  );
}