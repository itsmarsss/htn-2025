import styled from 'styled-components'
import { useEditor } from '../store/editor'

const Rail = styled.div`
  position: absolute;
  top: 56px;
  bottom: 12px;
  left: 12px;
  width: 52px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Btn = styled.button`
  width: 52px;
  height: 40px;
  background: rgba(18, 20, 26, 0.9);
  color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
`

export function Toolbar() {
  const add = useEditor(s => s.addObject)
  const del = useEditor(s => s.deleteSelected)
  const dup = useEditor(s => s.duplicateSelected)

  return (
    <Rail>
      <Btn onClick={() => add('box')}>Box</Btn>
      <Btn onClick={() => add('sphere')}>Sphere</Btn>
      <Btn onClick={() => add('cylinder')}>Cyl</Btn>
      <Btn onClick={() => add('cone')}>Cone</Btn>
      <Btn onClick={() => add('torus')}>Torus</Btn>
      <Btn onClick={() => add('plane')}>Plane</Btn>
      <Btn onClick={dup}>Dup</Btn>
      <Btn onClick={del}>Del</Btn>
    </Rail>
  )
}

export default Toolbar
