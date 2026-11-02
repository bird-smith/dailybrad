import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // './' lets the site work at username.github.io/repo-name/ and on a custom domain.
  base: './',
  plugins: [react(), tailwindcss()],
})
