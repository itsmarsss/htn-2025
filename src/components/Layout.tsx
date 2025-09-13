import styled, { createGlobalStyle } from 'styled-components'
import Topbar from './Topbar'
import Toolbar from './Toolbar'
import Inspector from './Inspector'
import Viewport from './Viewport'
import { useShortcuts } from '../hooks/useShortcuts'
import SnapPanel from './SnapPanel'
import BooleanPanel from './BooleanPanel'

const Global = createGlobalStyle`
  html, body, #root {
    height: 100%;
  }
  body {
    margin: 0;
    background: #0b0e14;
    color: #e6e9ef;
    overflow: hidden;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  }
  * { box-sizing: border-box; }
  button { cursor: pointer; }
`

const Root = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`

const ViewportWrap = styled.div`
  position: absolute;
  inset: 56px 0 0 0;
`

export function Layout() {
  useShortcuts()
  return (
    <Root>
      <Global />
      <Topbar />
      <ViewportWrap>
        <Viewport />
      </ViewportWrap>
      <Toolbar />
      <Inspector />
      <SnapPanel />
      <BooleanPanel />
    </Root>
  )
}

export default Layout
