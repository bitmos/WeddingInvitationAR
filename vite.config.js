import { defineConfig } from 'vite'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

// Dev-only plugin: lets the export page POST generated model bytes straight to
// disk (POST /__save?name=models/scene.glb  with the raw binary body).
function saveAssetPlugin() {
  return {
    name: 'save-asset',
    configureServer(server) {
      server.middlewares.use('/__save', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return }
        const url = new URL(req.url, 'http://localhost')
        const name = url.searchParams.get('name')
        if (!name || name.includes('..')) { res.statusCode = 400; res.end('bad name'); return }
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
          const out = resolve(server.config.root, 'public', name)
          mkdirSync(dirname(out), { recursive: true })
          writeFileSync(out, Buffer.concat(chunks))
          res.statusCode = 200
          res.end('saved ' + name + ' (' + Buffer.concat(chunks).length + ' bytes)')
        })
      })
    }
  }
}

export default defineConfig({
  // Relative base so the built site works whether served from the domain root
  // or a GitHub Pages project subpath (bitmos.github.io/WeddingInvitationAR/).
  base: './',
  plugins: [saveAssetPlugin()],
  server: {
    https: false,
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist'
  }
})
