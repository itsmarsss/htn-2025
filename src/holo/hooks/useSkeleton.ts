// Minimal placeholder to keep types and structure ready; full port available on request
import { useCallback } from "react";
import type { Hand } from "../objects/hand";

interface ImageSize {
    width: number;
    height: number;
}

export default function useSkeleton({
    overlayCanvasRef,
    fpsRef,
    updateInteractionState,
}: {
    overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    fpsRef: React.MutableRefObject<number>;
    updateInteractionState: (s: any) => void;
}) {
    const processHands = useCallback(
        (
            hands: Hand[],
            imageSize: ImageSize,
            ctx: CanvasRenderingContext2D
        ) => {
            const state: any = { Left: null, Right: null, angleBetween: 0 };
            const diag = Math.hypot(imageSize.width, imageSize.height);
            const pinchPx = Math.max(20, diag * 0.04);

            const targetW = overlayCanvasRef.current?.width || imageSize.width;
            const targetH =
                overlayCanvasRef.current?.height || imageSize.height;
            const scaleX = targetW / imageSize.width;
            const scaleY = targetH / imageSize.height;

            hands.forEach((hand) => {
                const thumb = hand.landmarks[4];
                const index = hand.landmarks[8];
                const cx = (thumb[0] + index[0]) / 2;
                const cy = (thumb[1] + index[1]) / 2;
                const dist = Math.hypot(
                    index[0] - thumb[0],
                    index[1] - thumb[1]
                );
                const isPinching = dist < pinchPx;

                const handState = {
                    isHolding: false,
                    isPinching,
                    cursor: { coords: { x: cx, y: cy }, angle: 0 },
                    depth: 0,
                };
                state[hand.handedness] = handState;

                // draw cursor dot and simple bone lines scaled to canvas size
                if (overlayCanvasRef.current) {
                    ctx.save();
                    ctx.fillStyle = isPinching ? "#4caf50" : "#f44336";
                    ctx.beginPath();
                    ctx.arc(cx * scaleX, cy * scaleY, 6, 0, Math.PI * 2);
                    ctx.fill();
                    if ((hand as any).connections) {
                        ctx.strokeStyle = "#88aaff";
                        ctx.lineWidth = 2;
                        for (const [a, b] of (hand as any)
                            .connections as number[][]) {
                            const p = hand.landmarks[a];
                            const q = hand.landmarks[b];
                            ctx.beginPath();
                            ctx.moveTo(p[0] * scaleX, p[1] * scaleY);
                            ctx.lineTo(q[0] * scaleX, q[1] * scaleY);
                            ctx.stroke();
                        }
                    }
                    ctx.restore();
                }
            });

            updateInteractionState(state);
        },
        [overlayCanvasRef, updateInteractionState]
    );
    const drawStrokes = useCallback((_ctx: CanvasRenderingContext2D) => {}, []);
    return { processHands, drawStrokes };
}
