import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Change 'polychrome' to your repository name if deploying to GitHub Pages project site
  // e.g., base: '/my-repo-name/'
  base: './', 
});