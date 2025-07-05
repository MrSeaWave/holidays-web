import react from '@vitejs/plugin-react';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

// 在配置中使用环境变量
// https://cn.vite.dev/config/#using-environment-variables-in-config
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    // cmd+shift 快速定位源码
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
});
