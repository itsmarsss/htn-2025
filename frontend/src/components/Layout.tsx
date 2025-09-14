import styled, { createGlobalStyle } from "styled-components";
import Topbar from "./Topbar";
import Toolbar from "./Toolbar";
import Inspector from "./Inspector";
// Viewport removed in favor of legacy Three.js renderer wired via HolohandsOverlay
import { useShortcuts } from "../hooks/useShortcuts";
import BooleanPanel from "./BooleanPanel";
import HolohandsOverlay from "../holo/components/HolohandsOverlay";
import ChatPanel from "./ChatPanel";
import { useEditor } from "../store/editor";
import VideoStream from "./VideoStream";
import { VideoStreamProvider } from "../holo/provider/VideoStreamContext";

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
`;

const Root = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
`;

// const ViewportWrap = styled.div`
//     position: absolute;
//     inset: 56px 0 0 0;
// `;

export function Layout() {
    useShortcuts();
    const showChat = useEditor((s) => s.showChatPanel);
    return (
        <VideoStreamProvider>
            <Root>
                <Global />
                <Topbar />
                {/* Three.js renderer is mounted inside HolohandsOverlay now */}
                <HolohandsOverlay />
                <Toolbar />
                <Inspector />
                <BooleanPanel />
                {showChat ? <ChatPanel /> : null}
                <VideoStream />
            </Root>
        </VideoStreamProvider>
    );
}

export default Layout;
