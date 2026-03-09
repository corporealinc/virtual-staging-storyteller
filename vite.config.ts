import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Safely handle the URL scheme for Windows + tsx environments
const getSafeDirname = () => {
  try {
    // Check if it's already a valid file URL, otherwise format it
    const metaUrl = import.meta.url.startsWith('file://') 
      ? import.meta.url 
      : `file:///${import.meta.url.replace(/\\/g, '/')}`;
      
    const __filename = fileURLToPath(metaUrl);
    return dirname(__filename);
  } catch (error) {
    // Fallback if the above fails
    console.warn("Path resolution fallback triggered.");
    return __dirname; 
  }
};

const _dirname = getSafeDirname();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(_dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});