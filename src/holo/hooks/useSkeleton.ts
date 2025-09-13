// Minimal placeholder to keep types and structure ready; full port available on request
import { useCallback } from "react";
import type { Hand } from "../objects/hand";

interface ImageSize {
    width: number;
    height: number;
}

export default function useSkeleton(_: {
    overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
    fpsRef: React.MutableRefObject<number>;
    updateInteractionState: (s: any) => void;
}) {
    const processHands = useCallback(
        (
            hands: Hand[],
            _imageSize: ImageSize,
            _ctx: CanvasRenderingContext2D
        ) => {
            // no-op demo; integrate full algorithm if needed
        },
        []
    );
    const drawStrokes = useCallback((_ctx: CanvasRenderingContext2D) => {}, []);
    return { processHands, drawStrokes };
}
