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
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router') || id.includes('@tanstack/react-query')) {
              return 'router-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('qrcode')) {
              return 'qrcode-vendor';
            }
            if (id.includes('canvas')) {
              return 'canvas-vendor';
            }
            if (id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            if (id.includes('file-saver') || id.includes('html2canvas')) {
              return 'file-vendor';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'ui-utils-vendor';
            }
            // Other node_modules
            return 'vendor';
          }
          // Application chunks
          if (id.includes('/components/qr/')) {
            return 'qr-components';
          }
          if (id.includes('/components/analytics/')) {
            return 'analytics';
          }
          if (id.includes('/components/auth/')) {
            return 'auth';
          }
          if (id.includes('/components/dashboard/')) {
            return 'dashboard';
          }
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
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
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'qrcode',
      '@supabase/supabase-js', // Include for proper module resolution
    ],
  },
}));
