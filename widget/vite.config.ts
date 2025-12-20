import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Plugin to inline all assets into HTML for ChatGPT sandbox
    {
      name: 'vite-plugin-singlefile-widget',
      enforce: 'post',
      generateBundle(_, bundle) {
        const htmlFiles = Object.keys(bundle).filter(name => name.endsWith('.html'));
        const cssFiles = Object.keys(bundle).filter(name => name.endsWith('.css'));
        const jsFiles = Object.keys(bundle).filter(name => name.endsWith('.js'));
        
        for (const htmlName of htmlFiles) {
          const htmlChunk = bundle[htmlName];
          if (htmlChunk.type !== 'asset') continue;
          
          let html = htmlChunk.source as string;
          
          // Remove modulepreload links (we're inlining everything)
          html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>/g, '');
          
          // Inline CSS
          for (const cssName of cssFiles) {
            const cssChunk = bundle[cssName];
            if (cssChunk.type !== 'asset') continue;
            
            const cssContent = cssChunk.source as string;
            const cssRegex = new RegExp(`<link[^>]*href=["'][^"']*${cssName.split('/').pop()}["'][^>]*>`, 'g');
            html = html.replace(cssRegex, `<style>${cssContent}</style>`);
          }
          
          // Inline JS
          for (const jsName of jsFiles) {
            const jsChunk = bundle[jsName];
            if (jsChunk.type !== 'chunk') continue;
            
            const jsContent = jsChunk.code;
            const jsRegex = new RegExp(`<script[^>]*src=["'][^"']*${jsName.split('/').pop()}["'][^>]*></script>`, 'g');
            html = html.replace(jsRegex, `<script type="module">${jsContent}</script>`);
          }
          
          // Clean up empty lines
          html = html.replace(/^\s*\n/gm, '');
          
          htmlChunk.source = html;
        }
        
        // Remove standalone CSS and JS files
        for (const name of [...cssFiles, ...jsFiles]) {
          delete bundle[name];
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Inline all assets
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        'pending-invites': resolve(__dirname, 'pending-invites.html'),
        'auth-status': resolve(__dirname, 'auth-status.html'),
        'respond-result': resolve(__dirname, 'respond-result.html'),
      },
      output: {
        // Single chunk per entry
        manualChunks: undefined,
        inlineDynamicImports: false,
      },
    },
  },
  server: {
    port: 5174,
  },
});

