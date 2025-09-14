import express from 'express'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8787

app.use(express.json({ limit: '20mb' }))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

function getLlms() {
  const martianKey = process.env.MARTIAN_API_KEY || process.env.VITE_MARTIAN_API_KEY
  const martianBase = process.env.MARTIAN_BASE_URL || 'https://api.withmartian.com/v1'

  if (martianKey) {
    return { provider: 'martian', baseUrl: martianBase, apiKey: martianKey, model: process.env.MARTIAN_MODEL || process.env.LLM_MODEL || 'openai/gpt-4.1-nano' }
  }

  const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
  const openaiBase = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  if (openaiKey) {
    return { provider: 'openai', baseUrl: openaiBase, apiKey: openaiKey, model: process.env.OPENAI_MODEL || process.env.LLM_MODEL || 'gpt-4o-mini' }
  }
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
  { type: 'function', function: { name: 'updateName', description: 'Rename an object', parameters: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, required: ['name'] } } },
  { type: 'function', function: { name: 'cloneGrid', description: 'Clone the target object into a 2D/3D grid of copies', parameters: { type: 'object', properties: { id: { type: 'string', description: 'If omitted, applies to currently selected object' }, countX: { type: 'integer', minimum: 1, default: 1 }, countY: { type: 'integer', minimum: 1, default: 1 }, countZ: { type: 'integer', minimum: 1, default: 1 }, spacingX: { type: 'number', default: 1 }, spacingY: { type: 'number', default: 1 }, spacingZ: { type: 'number', default: 1 } } } } },
  { type: 'function', function: { name: 'importGLTFFromAttachment', description: 'Import a GLTF/GLB model from the user attachment', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'importGLTFByUrl', description: 'Import a GLTF/GLB model from a URL', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } } },
]

const systemPrompt = `You are a 3D modeling copilot. Use the provided tools to carry out user requests in a precise, deterministic way.
- Prefer tool calls over text responses whenever possible.
- Units: position/scale in editor units. Rotation is in radians; if the user gives degrees, convert to radians.
- If the user asks to "move/rotate/scale by" amounts, use isDelta: true.
- When the user refers to objects by name, assume exact match on existing scene object names if provided in context.
- If an image is provided in the user message, use it as visual context to ground your actions (e.g., infer colors, shapes, or layout), but still express changes via tool calls.
- You can also rename objects and create grids of copies using updateName and cloneGrid.
- If the user attaches a .glb/.gltf or provides a URL, import it using importGLTFFromAttachment or importGLTFByUrl.

Examples:
User: "Make a table with a thin rectangular top around 1.6 by 0.9, and four thin legs 0.7 tall at the corners"
Assistant (tools in order):
1) addObject {"kind":"box","params":{"width":1.6,"height":0.08,"depth":0.9}}
2) updateName {"name":"TableTop"}
3) updateTransform {"isDelta":false,"position":{"x":0,"y":0.75,"z":0}}
4) addObject {"kind":"cylinder","params":{"radiusTop":0.05,"radiusBottom":0.05,"height":0.7}}
5) updateName {"name":"Leg"}
6) updateTransform {"isDelta":false,"position":{"x":-0.75,"y":0.35,"z":-0.45}}
7) cloneGrid {"countX":2,"countZ":2,"spacingX":1.5,"spacingZ":0.9}

User: "Use this image for the color scheme" [image]
Assistant: updateMaterial {"id":"<selectedOrLast>","color":"#8b5a2b"}

Only produce natural language when no tool call is appropriate.`

app.get('/api/health', (req, res) => {
  const llm = getLlms()
  res.json({ ok: !!llm, provider: llm?.provider ?? null, baseUrl: llm?.baseUrl ?? null, model: llm?.model ?? null, hasKey: !!llm?.apiKey })
})

app.post('/api/chat', async (req, res) => {
  const llm = getLlms()
  if (!llm) return res.status(500).json({ error: 'No LLM API key configured. Set MARTIAN_API_KEY (+ optional MARTIAN_BASE_URL) or OPENAI_API_KEY (+ optional OPENAI_BASE_URL).' })

  const { user, sceneSummary, attachment } = req.body || {}
  if (!user || typeof user !== 'string') return res.status(400).json({ error: 'Missing user prompt' })

  // Build multimodal user content when an image is attached
  let userContent = user
  if (attachment && typeof attachment === 'object') {
    const name = attachment.name || 'file'
    const type = attachment.type || ''
    const size = typeof attachment.size === 'number' ? attachment.size : undefined
    const data = attachment.data

    if (type && /^image\//.test(type) && data && typeof data === 'string') {
      const dataUrl = `data:${type};base64,${data}`
      userContent = [
        { type: 'text', text: user },
        { type: 'image_url', image_url: { url: dataUrl } }
      ]
    } else {
      const attachmentInfo = `[Attachment: ${name}${type ? `, ${type}` : ''}${size ? `, ${size} bytes` : ''}]`
      userContent = `${user}\n\n${attachmentInfo}`
    }
  }

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