import node from '@astrojs/node'
import solidJs from '@astrojs/solid-js'
import AstroPWA from '@vite-pwa/astro'
import { defineConfig } from 'astro/config'
import disableBlocks from './src/plugins/disableBlocks'


import tailwind from '@tailwindcss/vite' 


import netlify from '@astrojs/netlify'
import vercel from '@astrojs/vercel'
import cloudflare from '@astrojs/cloudflare'


const envAdapter = () => {
  switch (process.env.OUTPUT) {
    case 'vercel':
      return vercel({
        webAnalytics: { enabled: true }, 
        imagesConfig: {
          
          sizes: [640, 750, 828, 1080, 1200],
          formats: ['image/avif', 'image/webp']
        }, 
        
        functionPerRoute: false
      })
    
    case 'netlify':
      return netlify()
    

    case 'cloudflare':
      return cloudflare({
        platformProxy: { enabled: true } 
      })

    default:

      return node({ mode: 'standalone' })
  }
}



export default defineConfig({
  output: 'server',

  adapter: envAdapter(),

  integrations: [

    solidJs(),

    AstroPWA({
      registerType: 'autoUpdate', 
      injectRegister: 'inline',
      manifest: {
        name: 'Fai Chat 2026',
        short_name: 'Gemini 2.5',
        description: '基于 Gemini 2.5 Flash 的极简对话界面',
        theme_color: '#212129',
        background_color: '#ffffff',
        display: 'standalone', 
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon.svg', sizes: '32x32', type: 'image/svg', purpose: 'any maskable' },
        ],
      },
      client: {
        installPrompt: true, 
        periodicSyncForUpdates: 20, 
      },
      devOptions: {
        enabled: false, 
      },
    }),
  ],

  vite: {
    
    plugins: [
      tailwind(), 
      
      (process.env.OUTPUT === 'vercel' ||
        process.env.OUTPUT === 'netlify' ||
        process.env.OUTPUT === 'cloudflare'
      ) ?disableBlocks() : null,
      disableBlocks(),
      
    ].filter(Boolean),
    
    build: {
      cssMinify: 'lightningcss', 
      chunkSizeWarningLimit: 1000,
   
      rollupOptions: {
        
        external: ['node:buffer', 'node:path', 'node:fs'],
      }
    },
   
  },
})