import type { Coords } from "./coords";

export interface InteractionState {
    Left: InteractionStateHand | null;
    Right: InteractionStateHand | null;
    angleBetween: number;
}

export interface InteractionStateHand {
    isHolding: boolean;
    isPinching: boolean;
    cursor: {
        coords: Coords;
        angle: number;
    } | null;
    depth: number;
}

export const DEFAULT_INTERACTION_STATE_HAND: InteractionStateHand = {
    isHolding: false,
    isPinching: false,
    cursor: null,
    depth: 0,
};

export const DEFAULT_INTERACTION_STATE: InteractionState = {
    Left: null,
    Right: null,
    angleBetween: 0,
};
