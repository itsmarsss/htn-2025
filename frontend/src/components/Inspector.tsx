import styled from 'styled-components'
import { useEditor } from '../store/editor'

const Panel = styled.div`
  position: absolute;
  top: 56px;
  bottom: 12px;
  right: 308px;
  width: 280px;
  background: rgba(18, 20, 26, 0.9);
  color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px;
  overflow: auto;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
`

const Title = styled.div`
  font-weight: 600;
  opacity: 0.9;
`

const CloseButton = styled.button`
  background: #12141a;
  color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-bottom: 10px;
`

const Label = styled.div`
  opacity: 0.7;
  margin: 8px 0 6px;
`

const Input = styled.input`
  background: #0f1116;
  border: 1px solid rgba(255,255,255,0.08);
  color: #e6e9ef;
  border-radius: 8px;
  padding: 6px 8px;
  width: 100%;
`

export function Inspector() {
  const selectedId = useEditor(s => s.selectedId)
  const objects = useEditor(s => s.objects)
  const updateTransform = useEditor(s => s.updateTransform)
  const updateMaterial = useEditor(s => s.updateMaterial)

  const obj = objects.find(o => o.id === selectedId)
  if (!obj) return null

  return (
    <Panel data-inspector-panel>
      <Header>
        <Title>Inspector</Title>
        <CloseButton onClick={() => {
          const panel = document.querySelector('[data-inspector-panel]') as HTMLElement;
          if (panel) panel.style.display = 'none';
        }}>✕</CloseButton>
      </Header>
      
      <Label>Transform</Label>
      <Row>
        <Input type="number" step="0.1" value={obj.position.x} onChange={(e) => updateTransform(obj.id, { position: { x: parseFloat(e.target.value) } })} />
        <Input type="number" step="0.1" value={obj.position.y} onChange={(e) => updateTransform(obj.id, { position: { y: parseFloat(e.target.value) } })} />
        <Input type="number" step="0.1" value={obj.position.z} onChange={(e) => updateTransform(obj.id, { position: { z: parseFloat(e.target.value) } })} />
      </Row>
      <Row>
        <Input type="number" step="0.05" value={obj.rotation.x} onChange={(e) => updateTransform(obj.id, { rotation: { x: parseFloat(e.target.value) } })} />
        <Input type="number" step="0.05" value={obj.rotation.y} onChange={(e) => updateTransform(obj.id, { rotation: { y: parseFloat(e.target.value) } })} />
        <Input type="number" step="0.05" value={obj.rotation.z} onChange={(e) => updateTransform(obj.id, { rotation: { z: parseFloat(e.target.value) } })} />
      </Row>
      <Row>
        <Input type="number" step="0.1" value={obj.scale.x} onChange={(e) => updateTransform(obj.id, { scale: { x: parseFloat(e.target.value) } })} />
        <Input type="number" step="0.1" value={obj.scale.y} onChange={(e) => updateTransform(obj.id, { scale: { y: parseFloat(e.target.value) } })} />
        <Input type="number" step="0.1" value={obj.scale.z} onChange={(e) => updateTransform(obj.id, { scale: { z: parseFloat(e.target.value) } })} />
      </Row>

      <Label>Material</Label>
      <Row>
        <Input type="color" value={obj.material.color} onChange={(e) => updateMaterial(obj.id, { color: e.target.value })} />
        <Input type="number" step="0.05" value={obj.material.metalness} onChange={(e) => updateMaterial(obj.id, { metalness: parseFloat(e.target.value) })} />
        <Input type="number" step="0.05" value={obj.material.roughness} onChange={(e) => updateMaterial(obj.id, { roughness: parseFloat(e.target.value) })} />
      </Row>
    </Panel>
  )
}

export default Inspector
