import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/node_modules/**', '**/.git/**']
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          memories: path.resolve(__dirname, 'memories.html'),
          memoryDetails: path.resolve(__dirname, 'memory-details.html'),
          achievements: path.resolve(__dirname, 'achievements.html'),
          achievementDetails: path.resolve(__dirname, 'achievement-details.html'),
          upload: path.resolve(__dirname, 'upload.html'),
          profile: path.resolve(__dirname, 'profile.html'),
        },
      },
    },
  };
});
