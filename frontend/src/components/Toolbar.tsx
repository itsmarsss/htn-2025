import styled from 'styled-components'
import { useEditor } from '../store/editor'

const Rail = styled.div`
  position: absolute;
  top: 56px;
  bottom: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
`

const Btn = styled.button`
  background: rgba(0, 0, 0, 0.8);
  color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 6px 10px;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(30, 30, 30, 0.8);
  }
  
  &:active {
    background: rgba(50, 50, 50, 0.8);
  }
`

const DuplicateBtn = styled.button`
  background: rgba(0, 100, 0, 0.8);
  color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 6px 10px;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(0, 120, 0, 0.8);
  }
  
  &:active {
    background: rgba(0, 140, 0, 0.8);
  }
`

const DeleteBtn = styled.button`
  background: rgba(100, 0, 0, 0.8);
  color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 6px 10px;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(120, 0, 0, 0.8);
  }
  
  &:active {
    background: rgba(140, 0, 0, 0.8);
  }
`

const Spacer = styled.div`
  height: 16px;
`

export function Toolbar() {
  const add = useEditor(s => s.addObject)
  const del = useEditor(s => s.deleteSelected)
  const dup = useEditor(s => s.duplicateSelected)

  return (
    <Rail>
      <Btn onClick={() => add('box')}>Box</Btn>
      <Btn onClick={() => add('sphere')}>Sphere</Btn>
      <Btn onClick={() => add('cylinder')}>Cylinder</Btn>
      <Btn onClick={() => add('cone')}>Cone</Btn>
      <Btn onClick={() => add('torus')}>Torus</Btn>
      <Btn onClick={() => add('plane')}>Plane</Btn>
      <Spacer />
      <DuplicateBtn onClick={dup}>Duplicate</DuplicateBtn>
      <DeleteBtn onClick={del}>Delete</DeleteBtn>
    </Rail>
  )
}

export default Toolbar
