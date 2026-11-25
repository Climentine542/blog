import { defineConfig } from 'astro/config';

// 页面和文章在构建时生成；音频作为静态文件随页面交付，无需 Node 服务。
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
