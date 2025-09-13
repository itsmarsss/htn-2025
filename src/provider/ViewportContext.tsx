import React, { createContext, useContext, useMemo, useRef } from "react";

type ViewportActions = {
    resetCamera: () => void;
    createCube: () => void;
    createSphere: () => void;
    startHandDrag: () => void;
    updateHandDragNormalized: (u: number, v: number) => void;
    endHandDrag: () => void;
    orbitRotate: (dxN: number, dyN: number) => void;
    orbitPan: (dxN: number, dyN: number) => void;
    orbitDolly: (delta: number) => void;
};

type RegisteredActions = Partial<ViewportActions>;

const noop = () => {};

const ViewportContext = createContext<ViewportActions | null>(null);

export function ViewportProvider({ children }: { children: React.ReactNode }) {
    const actionsRef = useRef<RegisteredActions>({});

    const value = useMemo<ViewportActions>(() => {
        return {
            resetCamera: () => (actionsRef.current.resetCamera || noop)(),
            createCube: () => (actionsRef.current.createCube || noop)(),
            createSphere: () => (actionsRef.current.createSphere || noop)(),
            startHandDrag: () => (actionsRef.current.startHandDrag || noop)(),
            updateHandDragNormalized: (u: number, v: number) =>
                (actionsRef.current.updateHandDragNormalized || noop)(u, v),
            endHandDrag: () => (actionsRef.current.endHandDrag || noop)(),
            orbitRotate: (dxN: number, dyN: number) =>
                (actionsRef.current.orbitRotate || noop)(dxN, dyN),
            orbitPan: (dxN: number, dyN: number) =>
                (actionsRef.current.orbitPan || noop)(dxN, dyN),
            orbitDolly: (delta: number) =>
                (actionsRef.current.orbitDolly || noop)(delta),
        };
    }, []);

    // Hidden registrar: expose a way for the viewport to register real actions
    // eslint-disable-next-line react/display-name
    (value as any).__registerViewportActions = (impl: RegisteredActions) => {
        actionsRef.current = { ...actionsRef.current, ...impl };
    };

    return (
        <ViewportContext.Provider value={value}>
            {children}
        </ViewportContext.Provider>
    );
}

export function useViewportActions() {
    const ctx = useContext(ViewportContext);
    if (!ctx)
        throw new Error(
            "useViewportActions must be used within ViewportProvider"
        );
    return ctx;
}

export function useRegisterViewportActions() {
    const ctx = useContext(ViewportContext) as any;
    if (!ctx)
        throw new Error(
            "useRegisterViewportActions must be used within ViewportProvider"
        );
    const register = (impl: RegisteredActions) =>
        ctx.__registerViewportActions?.(impl);
    return register as (impl: RegisteredActions) => void;
}
