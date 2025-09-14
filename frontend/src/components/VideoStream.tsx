import styled from "styled-components";
import { useVideoStream } from "../holo/provider/VideoStreamContext";

const VideoContainer = styled.div`
    background: rgba(30, 34, 44, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 6px;
    margin: 6px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
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
    const { videoRef, getStatus } = useVideoStream();

    return (
        <VideoContainer>
            <Video ref={videoRef as any} autoPlay muted />
            <Status>{getStatus()}</Status>
        </VideoContainer>
    );
}

export default VideoStream;
