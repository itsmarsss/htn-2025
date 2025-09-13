export interface Hand {
    handedness: "Left" | "Right";
    landmarks: number[][];
    connections: number[][];
    detected_symbols?: [string, number][];
}

export const HAND_COLORS: Record<"Left" | "Right", string> = {
    Left: "#FF0000",
    Right: "#00FF00",
};
