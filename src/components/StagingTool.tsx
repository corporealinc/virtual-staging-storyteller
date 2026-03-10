import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, Upload, Sparkles, Loader2, Home } from 'lucide-react';

interface StagingToolProps {
  onSubmit: (image: File, style: string, roomType: string, fengShui: boolean) => void;
  isProcessing: boolean;
}

const ROOM_TYPES = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Dining Room",
  "Bathroom",
  "Home Office",
  "Nursery",
  "Guest Room",
];

const PRESET_STYLES = [
  { name: "Modern Farmhouse", image: "/images/modern_farmhouse.png" },
  { name: "Scandinavian Minimalist", image: "/images/scandinavian_minimalist.png" },
  { name: "Industrial Loft", image: "/images/industrial_loft.png" },
  { name: "Mid-Century Modern", image: "/images/mid_century_modern.png" },
  { name: "Coastal Breeze", image: "/images/coastal_breeze.png" },
  { name: "Traditional Luxury", image: "/images/traditional_luxury.png" },
];

export default function StagingTool({ onSubmit, isProcessing }: StagingToolProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState('');
  const [roomType, setRoomType] = useState('Bedroom');
  const [customRoomType, setCustomRoomType] = useState('');
  const [fengShui, setFengShui] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    const finalRoomType = roomType === 'Other' ? customRoomType : roomType;
    if (selectedImage && style && finalRoomType) {
      onSubmit(selectedImage, style, finalRoomType, fengShui);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center">
        <h2 className="text-4xl font-inter font-bold text-navy mb-2">Visualize Your Dream Home</h2>
        <p className="text-navy/70 text-lg">Snap / Upload a photo and select a style to instantly bring your vision to life.</p>
      </div>

      {/* Image Upload Area */}
      <div className="bg-white p-6 rounded shadow-sm border border-navy/10">
        {!previewUrl ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-navy/20 rounded p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors group"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Camera className="w-8 h-8 text-gold" />
            </div>
            <div className="text-center">
              <p className="font-bold text-navy text-lg">Tap to take a photo</p>
              <p className="text-sm text-navy/60">or upload from gallery</p>
            </div>
          </div>
        ) : (
          <div className="relative rounded overflow-hidden aspect-video bg-gray-50 shadow-inner">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => {
                setSelectedImage(null);
                setPreviewUrl(null);
              }}
              className="absolute top-4 right-4 bg-navy/80 hover:bg-navy text-white p-3 rounded-full backdrop-blur-sm transition-colors shadow-lg"
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

      {/* Room Type Selection */}
      <div className="bg-white p-6 rounded shadow-sm border border-navy/10 space-y-4">
        <label className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wide">
          <Home className="w-4 h-4 text-gold" /> Room Type
        </label>
        <select
          value={roomType}
          onChange={(e) => {
            setRoomType(e.target.value);
            if (e.target.value !== 'Other') setCustomRoomType('');
          }}
          className="w-full px-4 py-3 bg-gray-50 rounded border border-navy/20 focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy"
        >
          {ROOM_TYPES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
          <option value="Other">Other (type below)</option>
        </select>
        {roomType === 'Other' && (
          <input
            type="text"
            value={customRoomType}
            onChange={(e) => setCustomRoomType(e.target.value)}
            placeholder="Enter room type..."
            className="w-full px-4 py-3 bg-gray-50 rounded border border-navy/20 focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400"
          />
        )}
      </div>

      {/* Feng Shui Toggle */}
      <div className="bg-white p-6 rounded shadow-sm border border-navy/10">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-bold text-navy uppercase tracking-wide">☯ Feng Shui Expert Design</p>
              <p className="text-xs text-navy/60">Arrange your space to balance energy (Qi) and maximize harmony, health, and prosperity.</p>
            </div>
          </div>
          <div
            onClick={() => setFengShui(!fengShui)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              fengShui ? 'bg-gold' : 'bg-navy/20'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                fengShui ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Style Selection */}
      <div className="bg-white p-6 rounded shadow-sm border border-navy/10 space-y-4">
        <label className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-gold" /> Choose a Style
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESET_STYLES.map((s) => (
            <button
              key={s.name}
              onClick={() => setStyle(s.name)}
              className={`rounded-[20px] text-sm font-bold transition-all border-2 overflow-hidden ${
                style === s.name
                  ? 'border-gold ring-2 ring-gold ring-offset-1'
                  : 'border-navy/20 hover:border-gold'
              }`}
            >
              <img src={s.image} alt={s.name} className="w-full aspect-[838/628] object-cover" />
              <span className={`block px-3 py-2 ${
                style === s.name ? 'bg-gold/10 text-navy' : 'text-navy/70'
              }`}>{s.name}</span>
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Or type your own vision..."
            className="w-full px-4 py-3 bg-gray-50 rounded border border-navy/20 focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedImage || !style || !(roomType === 'Other' ? customRoomType : roomType) || isProcessing}
        className={`w-full py-4 rounded font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg uppercase tracking-wide ${
          !selectedImage || !style || isProcessing
            ? 'bg-navy/10 text-navy/40 cursor-not-allowed shadow-none'
            : 'bg-navy hover:bg-navy/90 text-white'
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