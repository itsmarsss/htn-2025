import { useEffect, useRef, useState } from "react";
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
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const fpsRef = useRef<number>(0);
    // no longer needed when using old-style loop
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

    // Initialize cached 2D context
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // desynchronized hint can reduce latency on some browsers/GPUs
        ctxRef.current =
            (canvas.getContext("2d", {
                alpha: true,
                desynchronized: true,
            } as any) as CanvasRenderingContext2D | null) ?? null;
    }, []);

    // Main loop copied from old implementation: capture->send->receive->draw per frame
    useEffect(() => {
        let raf: number;
        let prevL: { x: number; y: number } | null = null;
        let prevR: { x: number; y: number } | null = null;
        let prevDist: number | null = null;
        const lastStatusRef = { value: "" } as { value: string };
        const lastStatusUpdateRef = { value: 0 } as { value: number };

        // FPS counters
        const frameCountRef = { value: 0 } as { value: number };
        const lastTimeRef = { value: Date.now() } as { value: number };

        const loop = async () => {
            // Throttle status updates
            const now = performance.now();
            if (now - lastStatusUpdateRef.value > 250) {
                const s = getConnectionStatus();
                if (s !== lastStatusRef.value) setStatus(s);
                lastStatusRef.value = s;
                lastStatusUpdateRef.value = now;
            }

            // Acknowledge & capture frame before drawing
            if (getAcknowledged()) {
                const frame = await captureFrame();
                if (frame) sendFrame(frame);
            }

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx =
                ctxRef.current ||
                (canvas.getContext("2d") as CanvasRenderingContext2D | null);
            if (!ctx) return;
            if (!ctxRef.current) ctxRef.current = ctx;

            const data = getData() as any;
            if (data && data.hands) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const size = { width: 640, height: 360 };
                processHands(data.hands, size, ctx);

                const anyPinch = Boolean(
                    (interactionRef.current.Left &&
                        interactionRef.current.Left.isPinching) ||
                        (interactionRef.current.Right &&
                            interactionRef.current.Right.isPinching)
                );
                if (anyPinch && !prevPinchingRef.current) startHandDrag();
                const refHand =
                    interactionRef.current.Right || interactionRef.current.Left;
                if (refHand && refHand.cursor) {
                    const u = Math.max(
                        0,
                        Math.min(1, refHand.cursor.coords.x / size.width)
                    );
                    const v = Math.max(
                        0,
                        Math.min(1, 1 - refHand.cursor.coords.y / size.height)
                    );
                    updateHandDragNormalized(u, v);
                }
                const L = interactionRef.current.Left;
                const R = interactionRef.current.Right;
                const lHold = Boolean(L?.isHolding);
                const rHold = Boolean(R?.isHolding);

                if (lHold && rHold && L?.cursor && R?.cursor) {
                    // Pan using left-hand movement
                    const dxPan =
                        (L.cursor.coords.x - (prevL?.x ?? L.cursor.coords.x)) /
                        size.width;
                    const dyPan =
                        (L.cursor.coords.y - (prevL?.y ?? L.cursor.coords.y)) /
                        size.height;
                    orbitPan(dxPan, dyPan);
                    prevL = { x: L.cursor.coords.x, y: L.cursor.coords.y };

                    // Zoom using distance change between hands
                    const currDist = Math.hypot(
                        R.cursor.coords.x - L.cursor.coords.x,
                        R.cursor.coords.y - L.cursor.coords.y
                    );
                    if (prevDist != null) {
                        const deltaZoom = (prevDist - currDist) / size.width;
                        orbitDolly(deltaZoom);
                    }
                    prevDist = currDist;
                } else if ((lHold && L?.cursor) || (rHold && R?.cursor)) {
                    // Rotate using whichever hand is holding
                    const H = rHold ? R! : L!;
                    const prev = rHold ? prevR : prevL;
                    const dx =
                        (H.cursor!.coords.x - (prev?.x ?? H.cursor!.coords.x)) /
                        size.width;
                    const dy =
                        (H.cursor!.coords.y - (prev?.y ?? H.cursor!.coords.y)) /
                        size.height;
                    orbitRotate(dx, dy);
                    if (rHold)
                        prevR = {
                            x: H.cursor!.coords.x,
                            y: H.cursor!.coords.y,
                        };
                    else
                        prevL = {
                            x: H.cursor!.coords.x,
                            y: H.cursor!.coords.y,
                        };
                    prevDist = null;
                } else {
                    // No holds: reset gesture memory
                    prevL = prevR = null;
                    prevDist = null;
                }
                if (!anyPinch && prevPinchingRef.current) endHandDrag();
                prevPinchingRef.current = anyPinch;
            }

            // FPS calc
            frameCountRef.value += 1;
            const deltaMs = Date.now() - lastTimeRef.value;
            if (deltaMs >= 1000) {
                fpsRef.current = frameCountRef.value;
                frameCountRef.value = 0;
                lastTimeRef.value = Date.now();
            }
        };

        const master = async () => {
            await loop();
            raf = requestAnimationFrame(master);
        };
        raf = requestAnimationFrame(master);
        return () => cancelAnimationFrame(raf);
    }, [
        getConnectionStatus,
        getAcknowledged,
        captureFrame,
        sendFrame,
        getData,
        processHands,
        startHandDrag,
        updateHandDragNormalized,
        endHandDrag,
        orbitRotate,
        orbitPan,
        orbitDolly,
    ]);

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
                    <div
                        style={{
                            fontSize: 12,
                            color: "#bbb",
                            background: "rgba(0,0,0,0.4)",
                            padding: "4px 6px",
                            borderRadius: 4,
                        }}
                    >
                        {status}
                    </div>
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
