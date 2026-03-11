/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import LeadForm from './components/LeadForm';
import StagingTool from './components/StagingTool';
import ResultView from './components/ResultView';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 'lead-capture' | 'staging' | 'result';

interface LeadData {
  name: string;
  email: string;
  phone: string;
}

interface StagingResult {
  image: string; // base64
  story: string;
}

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('lead-capture');
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [result, setResult] = useState<StagingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Check for API key selection on mount
  useState(() => {
    const checkApiKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
      }
    };
    checkApiKey();
  });

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Assume success after dialog closes
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Error selecting API key:", e);
    }
  };

  const [leadId, setLeadId] = useState<number | null>(null);

  const handleLeadSubmit = async (data: LeadData) => {
    setLeadData(data);
    setCurrentState('staging');

    // Save lead to database immediately
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.id) setLeadId(result.id);
    } catch (err) {
      console.error('Failed to save lead:', err);
    }
  };

  const handleStagingSubmit = async (image: File, style: string, roomType: string, fengShui: boolean) => {
    if (!leadData) return;
    
    setIsProcessing(true);
    setError(null);
    setOriginalImage(image);

    try {
      const formData = new FormData();
      formData.append('name', leadData.name);
      formData.append('email', leadData.email);
      formData.append('phone', leadData.phone);
      formData.append('style', style);
      formData.append('roomType', roomType);
      formData.append('fengShui', String(fengShui));
      if (leadId) formData.append('leadId', String(leadId));
      formData.append('image', image);

      const response = await fetch('/api/stage-room', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to stage room');
      }

      const data = await response.json();
      setResult(data);
      setCurrentState('result');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResult(null);
    setCurrentState('staging');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter text-navy selection:bg-gold/30 selection:text-navy">
      <header className="bg-gray-50 border-b border-navy/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="Open House APP Logo" 
              className="h-10 w-auto object-contain" 
            />
            <span className="font-inter font-bold text-2xl tracking-tight text-navy">Open House APP</span>
          </div>
          {leadData && (
            <div className="text-sm text-navy/70 hidden sm:block uppercase tracking-wider font-bold">
              Welcome, <span className="text-navy">{leadData.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!hasApiKey ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <h2 className="text-4xl font-inter font-bold text-navy">API Key Required</h2>
            <p className="text-navy/80 max-w-lg text-lg">
              To use the high-quality <strong>Gemini Image</strong> model, you need to select a paid API key from a Google Cloud project.
            </p>
            <button
              onClick={handleSelectKey}
              className="bg-navy hover:bg-navy/90 text-white font-bold py-3 px-8 rounded transition-colors shadow-lg"
            >
              Select API Key
            </button>
            <p className="text-sm text-navy/60">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold transition-colors">
                Learn more about billing
              </a>
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentState === 'lead-capture' && (
            <motion.div
              key="lead-capture"
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-center mb-12 max-w-2xl">
                <h1 className="text-4xl sm:text-6xl font-inter font-bold text-navy mb-6 tracking-tight leading-tight">
                  Virtual Staging <span className="text-gold italic pr-2">Storyteller</span>
                </h1>
                <p className="text-xl text-navy/80 leading-relaxed font-light">
                  Instantly visualize the potential of this home. Snap a photo, choose a style, and let AI tell the story.
                </p>
              </div>
              {/* Form Component */}
              <LeadForm onSubmit={handleLeadSubmit} />
            </motion.div>
          )}

          {currentState === 'staging' && (
            <motion.div
              key="staging"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StagingTool onSubmit={handleStagingSubmit} isProcessing={isProcessing} />
              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded border border-red-200 text-center max-w-2xl mx-auto font-bold">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {currentState === 'result' && result && originalImage && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ResultView
                originalImage={originalImage}
                stagedImageBase64={result.image}
                story={result.story}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </main>
    </div>
  );
}