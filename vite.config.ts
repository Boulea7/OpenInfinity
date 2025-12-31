import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.json';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  optimizeDeps: {
    // Exclude prosemirror packages from pre-bundling to avoid duplicate extension warnings
    exclude: ['@tiptap/pm', 'prosemirror-markdown'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/newtab/components'),
      '@/stores': resolve(__dirname, 'src/newtab/stores'),
      '@/hooks': resolve(__dirname, 'src/newtab/hooks'),
      '@/services': resolve(__dirname, 'src/newtab/services'),
      '@/utils': resolve(__dirname, 'src/newtab/utils'),
      '@/types': resolve(__dirname, 'src/newtab/types'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, 'src/newtab/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        manualChunks: {
          // Core React bundle
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          // Drag and drop
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // Data fetching
          'query-vendor': ['@tanstack/react-query'],
          // Internationalization
          'i18n-vendor': ['i18next', 'react-i18next'],
          // Code editor (heavy, lazy loaded in components)
          'editor-vendor': ['@uiw/react-codemirror', '@codemirror/lang-markdown', '@codemirror/language'],
          // State management
          'zustand-vendor': ['zustand'],
        },
      },
    },
  },
});
