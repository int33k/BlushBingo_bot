/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Plugin } from 'vite'

/**
 * Vite plugin to fix Edge browser compatibility issues
 * Addresses content-type headers, cache-control, and other Edge-specific requirements
 */
export function edgeCompatibilityPlugin(): Plugin {
  return {
    name: 'edge-compatibility',
    configureServer(server) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // Set proper content-type headers based on file extension
        const url = req.url || ''
        
        if (url.endsWith('.js') || url.includes('.js?')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        } else if (url.endsWith('.ts') || url.includes('.ts?')) {
          res.setHeader('Content-Type', 'text/x-typescript; charset=utf-8')
        } else if (url.endsWith('.css') || url.includes('.css?')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8')
        } else if (url.endsWith('.tsx') || url.includes('.tsx?')) {
          res.setHeader('Content-Type', 'text/x-typescript; charset=utf-8')
        } else if (url.endsWith('.json') || url.includes('.json?')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
        }
        
        // Set cache control headers for Edge DevTools compatibility
        if (url.includes('/src/') || url.includes('/@')) {
          // Development files - no cache for Edge DevTools
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
          res.setHeader('Pragma', 'no-cache')
          res.setHeader('Expires', '0')
        } else {
          // Static assets - short cache
          res.setHeader('Cache-Control', 'public, max-age=3600')
        }
        
        // Add Edge compatibility headers
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('X-Frame-Options', 'SAMEORIGIN')
        res.setHeader('X-XSS-Protection', '1; mode=block')
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        next()
      })
    },
    configurePreviewServer(server) {
      // Same headers for preview mode
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url || ''
        
        if (url.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        } else if (url.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8')
        }
        
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        res.setHeader('X-Content-Type-Options', 'nosniff')
        
        next()
      })
    }
  }
}
