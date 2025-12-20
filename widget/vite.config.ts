import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Plugin to create fully self-contained HTML files for ChatGPT widgets.
 * All JS and CSS are inlined directly into the HTML.
 */
function singleFilePlugin(): Plugin {
  return {
    name: 'single-file-html',
    enforce: 'post',
    apply: 'build',
    
    generateBundle(_, bundle) {
      // Collect all JS chunks
      const jsChunks: Map<string, string> = new Map();
      const cssChunks: Map<string, string> = new Map();
      
      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && name.endsWith('.js')) {
          jsChunks.set(name, chunk.code);
        }
        if (chunk.type === 'asset' && name.endsWith('.css')) {
          cssChunks.set(name, chunk.source as string);
        }
      }
      
      // Combine all JS code into one bundle
      // Order: shared chunks first, then entry chunks
      const sharedJs: string[] = [];
      const entryJs: Map<string, string> = new Map();
      
      for (const [name, code] of jsChunks) {
        if (name.includes('all-') || name.includes('main-')) {
          sharedJs.push(code);
        } else {
          entryJs.set(name, code);
        }
      }
      
      // Merge all CSS
      const allCss = Array.from(cssChunks.values()).join('\n');
      
      // Merge all JS (shared first, then entries)
      // Remove external imports since we're bundling everything
      let allJs = [...sharedJs, ...entryJs.values()].join('\n');
      
      // Remove import/export statements that reference files
      allJs = allJs.replace(/import\s*\{[^}]*\}\s*from\s*["'][^"']+\.js["'];?/g, '');
      allJs = allJs.replace(/import\s+["'][^"']+\.js["'];?/g, '');
      allJs = allJs.replace(/export\s*\{[^}]*\};?/g, '');
      
      // Process HTML files
      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'asset' || !name.endsWith('.html')) continue;
        
        let html = chunk.source as string;
        
        // Remove all external script and link tags
        html = html.replace(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/g, '');
        html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/g, '');
        html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>/g, '');
        
        // Insert inline styles before </head>
        if (allCss) {
          html = html.replace('</head>', `<style>${allCss}</style>\n</head>`);
        }
        
        // Insert inline script before </body>
        if (allJs) {
          html = html.replace('</body>', `<script type="module">${allJs}</script>\n</body>`);
        }
        
        chunk.source = html;
      }
      
      // Remove standalone JS and CSS files from bundle
      for (const name of Object.keys(bundle)) {
        if (name.endsWith('.js') || name.endsWith('.css')) {
          delete bundle[name];
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), singleFilePlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        'pending-invites': resolve(__dirname, 'pending-invites.html'),
        'auth-status': resolve(__dirname, 'auth-status.html'),
        'respond-result': resolve(__dirname, 'respond-result.html'),
      },
      output: {
        // Force all code into one chunk
        manualChunks: () => 'all',
      },
    },
  },
  server: {
    port: 5174,
  },
});
