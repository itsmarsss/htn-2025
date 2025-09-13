import styled from 'styled-components'
import { useMemo, useRef, useState } from 'react'
import { useEditor } from '../store/editor'
import type { GeometryKind, SceneObject } from '../types'

const Panel = styled.div`
  position: absolute;
  top: 56px;
  bottom: 12px;
  right: 12px;
  width: 280px;
  background: rgba(18, 20, 26, 0.9);
  color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Header = styled.div`
  padding: 8px 12px;
  font-weight: 600;
  opacity: 0.9;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`

const Messages = styled.div`
  flex: 1;
  padding: 8px 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Message = styled.div<{ role: 'user' | 'system' }>`
  align-self: ${p => (p.role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${p => (p.role === 'user' ? 'rgba(60, 65, 80, 0.6)' : 'rgba(30, 34, 44, 0.8)')};
  border: 1px solid rgba(255,255,255,0.08);
  color: #e6e9ef;
  padding: 6px 10px;
  border-radius: 10px;
  max-width: 70%;
  white-space: pre-wrap;
`

const InputRow = styled.form`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 8px 8px 10px 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
`

const TextInput = styled.input`
  background: #0f1116;
  border: 1px solid rgba(255,255,255,0.08);
  color: #e6e9ef;
  border-radius: 10px;
  padding: 8px 10px;
`

const SendBtn = styled.button`
  background: rgba(18, 20, 26, 0.9);
  color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 8px 12px;
`

type ChatMsg = { role: 'user' | 'system'; text: string }

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function parseNumber(s: string | undefined, fallback: number) {
  if (s == null) return fallback
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : fallback
}

const COLOR_NAMES: Record<string, string> = {
  red: '#ff4d4f',
  green: '#52c41a',
  blue: '#1890ff',
  yellow: '#fadb14',
  orange: '#fa8c16',
  purple: '#722ed1',
  pink: '#eb2f96',
  white: '#ffffff',
  black: '#000000',
  gray: '#8c8c8c',
}

export function ChatPanel() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: 'system',
    text: 'Try: "add box", "move x 1 y 0 z -0.5", "rotate y 45", "scale 1.5", "color red", "delete", "duplicate", "select Sphere", "union A B", "undo"',
  }])

  const objects = useEditor(s => s.objects)
  const selectedId = useEditor(s => s.selectedId)
  const addObject = useEditor(s => s.addObject)
  const deleteSelected = useEditor(s => s.deleteSelected)
  const duplicateSelected = useEditor(s => s.duplicateSelected)
  const select = useEditor(s => s.select)
  const setMode = useEditor(s => s.setMode)
  const updateTransform = useEditor(s => s.updateTransform)
  const updateMaterial = useEditor(s => s.updateMaterial)
  const updateGeometry = useEditor(s => s.updateGeometry)
  const booleanOp = useEditor(s => s.booleanOp)
  const undo = useEditor(s => s.undo)
  const redo = useEditor(s => s.redo)
  const toggleSnap = useEditor(s => s.toggleSnap)
  const setSnap = useEditor(s => s.setSnap)

  const selected = useMemo(() => objects.find(o => o.id === selectedId) ?? null, [objects, selectedId])
  const scrollRef = useRef<HTMLDivElement>(null)

  function push(role: ChatMsg['role'], text: string) {
    setMessages(prev => [...prev, { role, text }])
    queueMicrotask(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  function findByNameOrId(nameOrId: string): SceneObject | undefined {
    const lower = nameOrId.toLowerCase()
    return objects.find(o => o.id.toLowerCase() === lower || o.name.toLowerCase() === lower)
  }

  function parseAddParams(kind: GeometryKind, rest: string): any | undefined {
    const get = (key: string) => {
      const m = rest.match(new RegExp(`${key}\\s+(-?\\d*\\.?\\d+)`, 'i'))
      return m ? parseFloat(m[1]) : undefined
    }
    if (kind === 'box') return { width: get('width') ?? 1, height: get('height') ?? 1, depth: get('depth') ?? 1 }
    if (kind === 'sphere') return { radius: get('radius') ?? 0.5 }
    if (kind === 'cylinder') return { radiusTop: get('radiustop') ?? get('radius') ?? 0.5, radiusBottom: get('radiusbottom') ?? get('radius') ?? 0.5, height: get('height') ?? 1 }
    if (kind === 'cone') return { radius: get('radius') ?? 0.5, height: get('height') ?? 1 }
    if (kind === 'torus') return { radius: get('radius') ?? 0.5, tube: get('tube') ?? 0.2 }
    if (kind === 'plane') return { width: get('width') ?? 1, height: get('height') ?? 1 }
    return undefined
  }

  function handleCommand(raw: string) {
    const text = raw.trim()
    if (!text) return
    push('user', text)

    const lc = text.toLowerCase()

    // mode
    if (/^mode\s+(translate|rotate|scale)/i.test(lc)) {
      const m = lc.match(/^mode\s+(translate|rotate|scale)/i)
      if (m) {
        setMode(m[1] as any)
        push('system', `Mode set to ${m[1]}`)
        return
      }
    }

    // snapping
    if (/^(enable|disable)\s+snapping/.test(lc)) {
      toggleSnap(lc.startsWith('enable'))
      push('system', `Snapping ${lc.startsWith('enable') ? 'enabled' : 'disabled'}`)
      return
    }
    if (/^snap\s+/.test(lc)) {
      const ts = lc.match(/translate\s+(-?\d*\.?\d+)/)
      const rs = lc.match(/rotate\s+(-?\d*\.?\d+)/)
      const ss = lc.match(/scale\s+(-?\d*\.?\d+)/)
      if (ts) setSnap({ translateSnap: parseFloat(ts[1]) })
      if (rs) setSnap({ rotateSnap: parseFloat(rs[1]) * Math.PI / 180 })
      if (ss) setSnap({ scaleSnap: parseFloat(ss[1]) })
      push('system', 'Snap updated')
      return
    }

    // undo/redo/clear
    if (lc === 'undo') { undo(); push('system', 'Undid last action'); return }
    if (lc === 'redo') { redo(); push('system', 'Redid last action'); return }
    if (lc === 'clear' || lc === 'reset scene') { window.location.reload(); return }

    // add object
    const addMatch = lc.match(/^add\s+(box|sphere|cylinder|cone|torus|plane)(.*)$/)
    if (addMatch) {
      const kind = addMatch[1] as GeometryKind
      const params = parseAddParams(kind, addMatch[2] ?? '')
      addObject(kind, params)
      push('system', `Added ${kind}${params ? ' with params' : ''}`)
      return
    }

    // delete / duplicate
    if (/^(delete|remove|del)$/.test(lc)) {
      if (!selected) { push('system', 'Nothing selected'); return }
      deleteSelected()
      push('system', 'Deleted selected object')
      return
    }
    if (/^(duplicate|copy|dup)$/.test(lc)) {
      if (!selected) { push('system', 'Nothing selected'); return }
      duplicateSelected()
      push('system', 'Duplicated selected object')
      return
    }

    // select by name
    const selByName = lc.match(/^select\s+(.+)$/)
    if (selByName) {
      const name = selByName[1].trim()
      const obj = findByNameOrId(name)
      if (obj) { select(obj.id); push('system', `Selected ${obj.name}`) }
      else push('system', `Could not find object "${name}"`)
      return
    }

    // color / material
    const colorMatch = lc.match(/(?:color|colour)\s+([^\s]+)/)
    if (colorMatch && selected) {
      const rawColor = colorMatch[1]
      const hex = COLOR_NAMES[rawColor] ?? rawColor
      updateMaterial(selected.id, { color: hex })
      push('system', `Set color to ${hex}`)
      return
    }

    const opacityMatch = lc.match(/opacity\s+(-?\d*\.?\d+)/)
    if (opacityMatch && selected) {
      const v = parseNumber(opacityMatch[1], 1)
      updateMaterial(selected.id, { opacity: v, transparent: v < 1 })
      push('system', `Set opacity to ${v}`)
      return
    }

    const metalMatch = lc.match(/metal(ness)?\s+(-?\d*\.?\d+)/)
    if (metalMatch && selected) {
      const v = parseNumber(metalMatch[2], 0.1)
      updateMaterial(selected.id, { metalness: v })
      push('system', `Set metalness to ${v}`)
      return
    }

    const roughMatch = lc.match(/rough(ness)?\s+(-?\d*\.?\d+)/)
    if (roughMatch && selected) {
      const v = parseNumber(roughMatch[2], 0.8)
      updateMaterial(selected.id, { roughness: v })
      push('system', `Set roughness to ${v}`)
      return
    }

    // move / translate (relative)
    const moveMatch = lc.match(/^(move|translate)\b(.*)$/)
    if (moveMatch && selected) {
      const rest = moveMatch[2]
      const dx = parseNumber(rest.match(/x\s+(-?\d*\.?\d+)/)?.[1], 0)
      const dy = parseNumber(rest.match(/y\s+(-?\d*\.?\d+)/)?.[1], 0)
      const dz = parseNumber(rest.match(/z\s+(-?\d*\.?\d+)/)?.[1], 0)
      updateTransform(selected.id, { position: { x: selected.position.x + dx, y: selected.position.y + dy, z: selected.position.z + dz } })
      push('system', `Moved by (${dx}, ${dy}, ${dz})`)
      return
    }

    // set position absolute: position x 1 y 2 z 3
    const posMatch = lc.match(/^pos(ition)?\b(.*)$/)
    if (posMatch && selected) {
      const rest = posMatch[2]
      const x = parseNumber(rest.match(/x\s+(-?\d*\.?\d+)/)?.[1], selected.position.x)
      const y = parseNumber(rest.match(/y\s+(-?\d*\.?\d+)/)?.[1], selected.position.y)
      const z = parseNumber(rest.match(/z\s+(-?\d*\.?\d+)/)?.[1], selected.position.z)
      updateTransform(selected.id, { position: { x, y, z } })
      push('system', `Position set to (${x}, ${y}, ${z})`)
      return
    }

    // rotate
    const rotMatch = lc.match(/^rot(ate)?\b(.*)$/)
    if (rotMatch && selected) {
      const rest = rotMatch[2]
      const hasDeg = /deg/.test(rest)
      const rxRaw = rest.match(/x\s+(-?\d*\.?\d+)/)?.[1]
      const ryRaw = rest.match(/y\s+(-?\d*\.?\d+)/)?.[1]
      const rzRaw = rest.match(/z\s+(-?\d*\.?\d+)/)?.[1]
      const rx = rxRaw ? (hasDeg ? toRadians(parseFloat(rxRaw)) : parseFloat(rxRaw)) : 0
      const ry = ryRaw ? (hasDeg ? toRadians(parseFloat(ryRaw)) : parseFloat(ryRaw)) : 0
      const rz = rzRaw ? (hasDeg ? toRadians(parseFloat(rzRaw)) : parseFloat(rzRaw)) : 0
      updateTransform(selected.id, { rotation: { x: selected.rotation.x + rx, y: selected.rotation.y + ry, z: selected.rotation.z + rz } })
      push('system', `Rotated by (${rx.toFixed(3)}, ${ry.toFixed(3)}, ${rz.toFixed(3)}) rad`)
      return
    }

    // scale
    const scaleMatch = lc.match(/^scale\b(.*)$/)
    if (scaleMatch && selected) {
      const rest = scaleMatch[1]
      const sxRaw = rest.match(/x\s+(-?\d*\.?\d+)/)?.[1]
      const syRaw = rest.match(/y\s+(-?\d*\.?\d+)/)?.[1]
      const szRaw = rest.match(/z\s+(-?\d*\.?\d+)/)?.[1]
      const uniRaw = rest.match(/\b(-?\d*\.?\d+)\b/)?.[1]
      const sx = sxRaw ? parseFloat(sxRaw) : uniRaw ? parseFloat(uniRaw) : 1
      const sy = syRaw ? parseFloat(syRaw) : uniRaw ? parseFloat(uniRaw) : 1
      const sz = szRaw ? parseFloat(szRaw) : uniRaw ? parseFloat(uniRaw) : 1
      updateTransform(selected.id, { scale: { x: selected.scale.x * sx, y: selected.scale.y * sy, z: selected.scale.z * sz } })
      push('system', `Scaled by (${sx}, ${sy}, ${sz})`)
      return
    }

    // change geometry kind
    const geomMatch = lc.match(/^set\s+(box|sphere|cylinder|cone|torus|plane)\b(.*)$/)
    if (geomMatch && selected) {
      const kind = geomMatch[1] as GeometryKind
      const params = parseAddParams(kind, geomMatch[2] ?? '')
      updateGeometry(selected.id, kind, params)
      push('system', `Changed geometry to ${kind}`)
      return
    }

    // boolean ops: union a b
    const boolMatch = lc.match(/^(union|subtract|intersect)\s+([^\s]+)\s+([^\s]+)$/)
    if (boolMatch) {
      const op = boolMatch[1] as 'union' | 'subtract' | 'intersect'
      const a = findByNameOrId(boolMatch[2])
      const b = findByNameOrId(boolMatch[3])
      if (!a || !b) { push('system', 'Could not find both operands'); return }
      booleanOp(op, a.id, b.id)
      push('system', `Boolean ${op} created from ${a.name} and ${b.name}`)
      return
    }

    push('system', 'Sorry, I did not understand. Try commands like: add box; move x 1; rotate y 45; scale 1.5; color #ff00ff; delete; duplicate; select Sphere; union A B; undo')
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = input
    setInput('')
    handleCommand(t)
  }

  return (
    <Panel>
      <Header>Chat</Header>
      <Messages ref={scrollRef}>
        {messages.map((m, i) => (
          <Message key={i} role={m.role}>{m.text}</Message>
        ))}
      </Messages>
      <InputRow onSubmit={onSubmit}>
        <TextInput
          placeholder={selected ? `Command for ${selected.name}…` : 'Command…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              // handled by form submit
            }
          }}
        />
        <SendBtn type="submit">Send</SendBtn>
      </InputRow>
    </Panel>
  )
}

export default ChatPanel 