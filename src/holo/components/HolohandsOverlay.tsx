import { useEffect, useMemo, useRef, useState } from "react";
import { WebSocketProvider, useWebSocket } from "../provider/WebSocketContext";
import {
    VideoStreamProvider,
    useVideoStream,
} from "../provider/VideoStreamContext";
import { useViewportActions } from "../../provider/ViewportContext";
import useSkeleton from "../hooks/useSkeleton";
import type { InteractionState } from "../objects/InteractionState";

function OverlayInner() {
    const {
        resetCamera,
        createCube,
        createSphere,
        startHandDrag,
        updateHandDragNormalized,
        endHandDrag,
    } = useViewportActions();
    const { getConnectionStatus, getData, sendFrame, getAcknowledged } =
        useWebSocket();
    const { videoRef, captureFrame } = useVideoStream();
    const [status, setStatus] = useState("Connecting...");
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

    // Match canvas to viewport area
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const topBar = 56;
            const width = window.innerWidth;
            const height = Math.max(0, window.innerHeight - topBar);
            canvas.style.left = "0px";
            canvas.style.top = `${topBar}px`;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.width = width;
            canvas.height = height;
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // Fast draw loop
    useEffect(() => {
        let raf: number;
        const draw = () => {
            setStatus(getConnectionStatus());
            const data = getData() as any;
            const canvas = canvasRef.current;
            if (data && data.hands && canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const size = data.image_size || { width: 640, height: 360 };
                    processHands(data.hands, size, ctx);
                    const anyPinch = Boolean(
                        (interactionRef.current.Left &&
                            interactionRef.current.Left.isPinching) ||
                            (interactionRef.current.Right &&
                                interactionRef.current.Right.isPinching)
                    );
                    if (anyPinch && !prevPinchingRef.current) startHandDrag();
                    const refHand =
                        interactionRef.current.Right ||
                        interactionRef.current.Left;
                    if (refHand && refHand.cursor) {
                        const u = Math.max(
                            0,
                            Math.min(1, refHand.cursor.coords.x / size.width)
                        );
                        const v = Math.max(
                            0,
                            Math.min(1, refHand.cursor.coords.y / size.height)
                        );
                        updateHandDragNormalized(u, v);
                    }
                    if (!anyPinch && prevPinchingRef.current) endHandDrag();
                    prevPinchingRef.current = anyPinch;
                }
            }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [
        getConnectionStatus,
        getData,
        processHands,
        startHandDrag,
        updateHandDragNormalized,
        endHandDrag,
    ]);

    // Throttled send loop (~15 fps)
    useEffect(() => {
        const interval = window.setInterval(async () => {
            if (!getAcknowledged()) return;
            const frame = await captureFrame();
            if (frame) sendFrame(frame);
        }, 66);
        return () => clearInterval(interval);
    }, [getAcknowledged, captureFrame, sendFrame]);

    // Force rerenders on status changes; data is consumed directly in loop

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
                    style={{
                        width: 160,
                        height: 90,
                        background: "#111",
                        transform: "scaleX(-1)",
                    }}
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
                style={{
                    position: "absolute",
                    background: "transparent",
                    zIndex: 5,
                    pointerEvents: "none",
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
