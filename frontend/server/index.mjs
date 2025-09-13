import express from 'express'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: '.env.local' })
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8787

app.use(express.json({ limit: '5mb' }))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Set up uploads directory and static serving
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}
app.use('/uploads', express.static(UPLOAD_DIR))

function getLlms() {
  const martianKey = process.env.MARTIAN_API_KEY || process.env.VITE_MARTIAN_API_KEY
  const martianBase = process.env.MARTIAN_BASE_URL || 'https://api.withmartian.com/v1'
  const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
  const openaiBase = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  if (martianKey) {
    return { provider: 'martian', baseUrl: martianBase, apiKey: martianKey, model: process.env.MARTIAN_MODEL || process.env.LLM_MODEL || 'openai/gpt-4.1-nano' }
  }
//   if (openaiKey) {
//     return { provider: 'openai', baseUrl: openaiBase, apiKey: openaiKey, model: process.env.OPENAI_MODEL || process.env.LLM_MODEL || 'gpt-4o-mini' }
//   }
  return null
}

const tools = [
  { type: 'function', function: { name: 'addObject', description: 'Add a primitive to the scene', parameters: { type: 'object', properties: { kind: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane'] }, params: { type: 'object', additionalProperties: true } }, required: ['kind'] } } },
  { type: 'function', function: { name: 'selectObject', description: 'Select an object by id or name', parameters: { type: 'object', properties: { target: { type: 'string' } }, required: ['target'] } } },
  { type: 'function', function: { name: 'updateTransform', description: 'Update position, rotation (radians), or scale. Use deltas when requested to move/rotate/scale by amounts.', parameters: { type: 'object', properties: { id: { type: 'string' }, position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } }, rotation: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } }, scale: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } }, isDelta: { type: 'boolean', description: 'If true, apply values as deltas (additive). Otherwise set absolute.' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'updateMaterial', description: 'Set material color (hex), metalness, roughness, opacity', parameters: { type: 'object', properties: { id: { type: 'string' }, color: { type: 'string' }, metalness: { type: 'number' }, roughness: { type: 'number' }, opacity: { type: 'number' }, transparent: { type: 'boolean' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'updateGeometry', description: 'Change geometry kind and optional params', parameters: { type: 'object', properties: { id: { type: 'string' }, kind: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane'] }, params: { type: 'object', additionalProperties: true } }, required: ['id', 'kind'] } } },
  { type: 'function', function: { name: 'duplicateSelected', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'deleteSelected', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'booleanOp', description: 'Run boolean operation between two objects A and B', parameters: { type: 'object', properties: { op: { type: 'string', enum: ['union', 'subtract', 'intersect'] }, a: { type: 'string' }, b: { type: 'string' } }, required: ['op', 'a', 'b'] } } },
  { type: 'function', function: { name: 'undo', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'redo', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'toggleSnap', parameters: { type: 'object', properties: { enabled: { type: 'boolean' } }, required: ['enabled'] } } },
  { type: 'function', function: { name: 'setSnap', parameters: { type: 'object', properties: { translateSnap: { type: 'number' }, rotateSnap: { type: 'number' }, scaleSnap: { type: 'number' } } } } },
  { type: 'function', function: { name: 'setMode', parameters: { type: 'object', properties: { mode: { type: 'string', enum: ['translate', 'rotate', 'scale'] } }, required: ['mode'] } } },
  { type: 'function', function: { name: 'importModelFromUrl', description: 'Import a 3D model (GLB/GLTF) from URL into the scene', parameters: { type: 'object', properties: { url: { type: 'string' }, name: { type: 'string' } }, required: ['url'] } } },
]

const systemPrompt = `You are a 3D modeling copilot. Use the provided tools to carry out user requests in a precise, deterministic way.
- Prefer tool calls over text responses whenever possible.
- Units: position/scale in editor units. Rotation is in radians; if the user gives degrees, convert to radians.
- If the user asks to "move/rotate/scale by" amounts, use isDelta: true.
- When the user refers to objects by name, assume exact match on existing scene object names if provided in context.
If the user provides an image URL, consider it as reference and propose or call importModelFromUrl if a suitable model URL is given.
Only produce natural language when no tool call is appropriate.`

app.get('/api/health', (req, res) => {
  const llm = getLlms()
  res.json({ ok: !!llm, provider: llm?.provider ?? null, baseUrl: llm?.baseUrl ?? null, model: llm?.model ?? null, hasKey: !!llm?.apiKey })
})

// Simple image upload endpoint: accepts JSON { dataUrl }
app.post('/api/upload-image', express.json({ limit: '25mb' }), (req, res) => {
  try {
    const { dataUrl } = req.body || {}
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ error: 'Expected dataUrl' })
    }
    const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
    if (!match) return res.status(400).json({ error: 'Invalid dataUrl' })
    const mime = match[1]
    const base64 = match[2]
    const ext = mime.includes('png') ? 'png' : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'bin'

    // Optional size guard (~base64 expands ~33%)
    if (base64.length > 35_000_000) {
      return res.status(413).json({ error: 'File too large' })
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filePath = path.join(UPLOAD_DIR, filename)
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
    const url = `/uploads/${filename}`
    return res.json({ url })
  } catch (err) {
    console.error('upload failed', err)
    return res.status(500).json({ error: 'Upload failed' })
  }
})

app.post('/api/chat', async (req, res) => {
  const llm = getLlms()
  if (!llm) return res.status(500).json({ error: 'No LLM API key configured. Set MARTIAN_API_KEY (+ optional MARTIAN_BASE_URL) or OPENAI_API_KEY.' })

  const { user, sceneSummary, imageUrl } = req.body || {}
  if (!user || typeof user !== 'string') return res.status(400).json({ error: 'Missing user prompt' })

  // Build OpenAI-compatible content with optional image
  const userContent = imageUrl && typeof imageUrl === 'string'
    ? [
        { type: 'text', text: user },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    : user

  const messages = [
    { role: 'system', content: systemPrompt },
    sceneSummary ? { role: 'system', content: `Scene: ${sceneSummary}` } : null,
    { role: 'user', content: userContent }
  ].filter(Boolean)

  const url = `${llm.baseUrl.replace(/\/$/, '')}/chat/completions`

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        model: llm.model,
        temperature: 0,
        messages,
        tools,
        tool_choice: 'auto'
      })
    })
    const data = await r.json()
    if (!r.ok) {
      console.error('Upstream error', data)
      return res.status(500).json({ error: 'Upstream error', details: data })
    }
    return res.json(data)
  } catch (err) {
    console.error('Request failed', err)
    return res.status(500).json({ error: 'Request failed', details: String(err) })
  }
})

const detected = getLlms()
console.log(`[LLM] provider=${detected?.provider ?? 'none'} base=${detected?.baseUrl ?? 'n/a'} model=${detected?.model ?? 'n/a'} hasKey=${!!detected?.apiKey}`)

app.listen(PORT, () => {
  console.log(`LLM server listening on http://localhost:${PORT}`)
}) 