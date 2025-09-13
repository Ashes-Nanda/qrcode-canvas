import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import compression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && compression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
      threshold: 1024,
      compressionOptions: { level: 9 }
    }),
    mode === 'production' && compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
      threshold: 1024,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'], // Prevent multiple React instances
  },
  define: {
    // Ensure React is available globally
    global: 'globalThis',
  },
  build: {
    // Performance optimizations
    target: 'esnext',
    minify: 'terser', // Switch to terser for better minification
    cssMinify: 'esbuild',
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 500, // Lower threshold for better chunking
    sourcemap: false, // Disable sourcemaps in production for smaller size
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
          output: {
            // Better manual chunking for optimal loading
        manualChunks: {
          // Keep ALL React-related code together
          'react-vendor': [
            'react', 
            'react-dom', 
            'react-dom/client',
            'react-router-dom',
            'react/jsx-runtime'
          ],
          // Separate other major vendors
          'ui-vendor': ['@radix-ui/react-slot', '@radix-ui/react-toast'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'query-vendor': ['@tanstack/react-query'],
          'qr-vendor': ['qrcode'],
        },
        // Better file names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^.]*$/, '')
            : 'chunk';
          return `js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|otf|eot/i.test(extType)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  // CSS optimizations
  css: {
    devSourcemap: mode === 'development',
  },
  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'qrcode',
      '@supabase/supabase-js',
      // Include all React ecosystem packages to ensure proper bundling
      'react/jsx-runtime',
      'react/jsx-dev-runtime'
    ],
    exclude: ['canvas', 'fs', 'path'], // Exclude all Node.js modules
    force: true // Force re-bundling on next dev
  },
}));
