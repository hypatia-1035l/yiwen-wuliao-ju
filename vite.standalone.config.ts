import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * 「双击即开」的单文件构建配置。
 *
 * 与默认构建的区别：
 *  1. output.format = 'iife'  —— 不产生 ES module，避免 file:// 下被 CORS 拦截
 *  2. inlineDynamicImports   —— 动态 import（jsPDF 的 html2canvas/purify）合并进主包
 *  3. assetsInlineLimit 极大  —— 一切资源转 dataURL，最终只有一个 html
 *
 * 目的：用户双击 html 时 file:// 协议也能正常启动，不需要本地服务器。
 */
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist-standalone',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    chunkSizeWarningLimit: 8000,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
