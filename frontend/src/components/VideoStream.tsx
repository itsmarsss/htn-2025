import styled from "styled-components";
import { useVideoStream } from "../holo/provider/VideoStreamContext";

const VideoContainer = styled.div`
    position: absolute;
    bottom: 12px;
    left: 12px;
    width: 200px;
    background: rgba(18, 20, 26, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 10;
`;

const Video = styled.video`
    width: 100%;
    height: 100px;
    background: #0f1116;
    border-radius: 6px;
    transform: scaleX(-1);
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.06);
`;

const Status = styled.div`
    font-size: 10px;
    color: #8c8c8c;
    background: rgba(0, 0, 0, 0.3);
    padding: 3px 6px;
    border-radius: 4px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.04);
`;

export function VideoStream() {
    const { videoRef, status } = useVideoStream();

    return (
        <VideoContainer>
            <Video ref={videoRef as any} autoPlay muted />
            <Status>{status}</Status>
        </VideoContainer>
    );
}

export default VideoStream;
