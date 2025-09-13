import React, { useEffect, useMemo, useRef, useState } from "react";
import { WebSocketProvider, useWebSocket } from "../provider/WebSocketContext";
import {
    VideoStreamProvider,
    useVideoStream,
} from "../provider/VideoStreamContext";
import { useViewportActions } from "../../provider/ViewportContext";
import useSkeleton from "../hooks/useSkeleton";
import type { InteractionState } from "../objects/InteractionState";

function OverlayInner() {
    const { resetCamera, createCube, createSphere } = useViewportActions();
    const { getConnectionStatus, getData, sendFrame, getAcknowledged } =
        useWebSocket();
    const { videoRef, captureFrame } = useVideoStream();
    const [status, setStatus] = useState("Connecting...");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fpsRef = useRef<number>(0);
    const interactionRef = useRef<InteractionState>({
        Left: null,
        Right: null,
        angleBetween: 0,
    });
    const prevPinchingRef = useRef<boolean>(false);

    const { processHands } = useSkeleton({
        overlayCanvasRef: canvasRef,
        fpsRef,
        updateInteractionState: (s: InteractionState) => {
            interactionRef.current = s;
        },
    });

    useEffect(() => {
        let raf: number;
        const loop = async () => {
            setStatus(getConnectionStatus());
            if (getAcknowledged()) {
                const frame = await captureFrame();
                if (frame) sendFrame(frame);
            }
            // Try to render current hands onto canvas
            const data = getData() as any;
            const canvas = canvasRef.current;
            if (data && data.hands && canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    processHands(data.hands, { width: 640, height: 360 }, ctx);
                    const anyPinch = Boolean(
                        (interactionRef.current.Left &&
                            interactionRef.current.Left.isPinching) ||
                            (interactionRef.current.Right &&
                                interactionRef.current.Right.isPinching)
                    );
                    if (anyPinch && !prevPinchingRef.current) {
                        // Simple demo action: insert a cube on pinch edge
                        createCube();
                    }
                    prevPinchingRef.current = anyPinch;
                }
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [
        getConnectionStatus,
        getAcknowledged,
        captureFrame,
        sendFrame,
        processHands,
        createCube,
    ]);

    const lastData = useMemo(() => getData(), [status]);

    return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div
                style={{
                    position: "absolute",
                    right: 12,
                    top: 64,
                    zIndex: 10,
                    display: "flex",
                    gap: 8,
                    pointerEvents: "auto",
                }}
            >
                <video
                    ref={videoRef as any}
                    style={{ width: 160, height: 90, background: "#111" }}
                    autoPlay
                    muted
                />
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                        WS: {status}
                    </div>
                    <button onClick={resetCamera}>Reset Camera</button>
                    <button onClick={createCube}>Insert Cube</button>
                    <button onClick={createSphere}>Insert Sphere</button>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={640}
                height={360}
                style={{
                    position: "absolute",
                    right: 12,
                    top: 164,
                    width: 320,
                    height: 180,
                    background: "transparent",
                    zIndex: 9,
                }}
            />
        </div>
    );
}

export default function HolohandsOverlay() {
    const wsUrl = "ws://localhost:6969/ws"; // adjust if needed
    return (
        <WebSocketProvider url={wsUrl}>
            <VideoStreamProvider>
                <OverlayInner />
            </VideoStreamProvider>
        </WebSocketProvider>
    );
}
