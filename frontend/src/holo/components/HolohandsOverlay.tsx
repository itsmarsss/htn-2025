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
        orbitRotate,
        orbitPan,
        orbitDolly,
    } = useViewportActions() as any;
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
        let prevL: { x: number; y: number } | null = null;
        let prevR: { x: number; y: number } | null = null;
        let prevDist: number | null = null;
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
                        // invert Y so upward movement increases Z positive
                        const v = Math.max(
                            0,
                            Math.min(
                                1,
                                1 - refHand.cursor.coords.y / size.height
                            )
                        );
                        updateHandDragNormalized(u, v);
                    }
                    // Camera gestures when not pinching
                    const L = interactionRef.current.Left;
                    const R = interactionRef.current.Right;
                    if (!anyPinch) {
                        if (R?.cursor) {
                            const dx =
                                (R.cursor.coords.x -
                                    (prevR?.x ?? R.cursor.coords.x)) /
                                size.width;
                            const dy =
                                (R.cursor.coords.y -
                                    (prevR?.y ?? R.cursor.coords.y)) /
                                size.height;
                            orbitRotate(dx, dy);
                            prevR = {
                                x: R.cursor.coords.x,
                                y: R.cursor.coords.y,
                            };
                        }
                        if (L?.cursor) {
                            const dx =
                                (L.cursor.coords.x -
                                    (prevL?.x ?? L.cursor.coords.x)) /
                                size.width;
                            const dy =
                                (L.cursor.coords.y -
                                    (prevL?.y ?? L.cursor.coords.y)) /
                                size.height;
                            orbitPan(dx, dy);
                            prevL = {
                                x: L.cursor.coords.x,
                                y: L.cursor.coords.y,
                            };
                        }
                        if (L?.cursor && R?.cursor) {
                            const currDist = Math.hypot(
                                R.cursor.coords.x - L.cursor.coords.x,
                                R.cursor.coords.y - L.cursor.coords.y
                            );
                            if (prevDist != null) {
                                const delta =
                                    (prevDist - currDist) / size.width;
                                orbitDolly(delta);
                            }
                            prevDist = currDist;
                        } else {
                            prevDist = null;
                        }
                    } else {
                        prevL = prevR = null;
                        prevDist = null;
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
