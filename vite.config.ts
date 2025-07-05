/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

const isTest = process.env.VITEST === 'true';

// 在配置中使用环境变量
// https://cn.vite.dev/config/#using-environment-variables-in-config
// https://vitejs.dev/config/
export default defineConfig({
  // https://cn.vite.dev/guide/static-deploy.html#github-pages
  // is repo name
  base: '/holidays-web',
  plugins: [
    react(),
    svgr(),
    // cmd+shift 快速定位源码
    !isTest &&
      codeInspectorPlugin({
        bundler: 'vite',
      }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:1337',
        changeOrigin: true,
      },
    },
    port: 3000,
    open: true,
    host: '0.0.0.0',
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    reporters: ['default', 'html', 'json'],
    outputFile: { html: './vitest/report/index.html', json: './vitest/report/test-results.json' },
  },
});
