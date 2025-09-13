import { create } from "zustand";
import { nanoid } from "nanoid";
import { produce } from "immer";
import type {
    EditorState,
    GeometryKind,
    HistoryState,
    SceneObject,
    SnapSettings,
    TransformMode,
    Vector3,
    Euler,
} from "../types";
import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { serializeGeometry } from "../utils/geometry";

function createDefaultMaterial() {
    return {
        color: "#9aa7ff",
        metalness: 0.1,
        roughness: 0.8,
        opacity: 1,
        transparent: false,
    };
}

function createVector3(x = 0, y = 0, z = 0): Vector3 {
    return { x, y, z };
}

function createEuler(x = 0, y = 0, z = 0): Euler {
    return { x, y, z };
}

function buildGeometryFromObject(o: SceneObject): THREE.BufferGeometry {
    switch (o.geometry) {
        case "box":
            return new THREE.BoxGeometry(
                (o.geometryParams as any)?.width ?? 1,
                (o.geometryParams as any)?.height ?? 1,
                (o.geometryParams as any)?.depth ?? 1
            );
        case "sphere":
            return new THREE.SphereGeometry(
                (o.geometryParams as any)?.radius ?? 0.5,
                32,
                16
            );
        case "cylinder":
            return new THREE.CylinderGeometry(
                (o.geometryParams as any)?.radiusTop ?? 0.5,
                (o.geometryParams as any)?.radiusBottom ?? 0.5,
                (o.geometryParams as any)?.height ?? 1,
                32
            );
        case "cone":
            return new THREE.ConeGeometry(
                (o.geometryParams as any)?.radius ?? 0.5,
                (o.geometryParams as any)?.height ?? 1,
                32
            );
        case "torus":
            return new THREE.TorusGeometry(
                (o.geometryParams as any)?.radius ?? 0.5,
                (o.geometryParams as any)?.tube ?? 0.2,
                16,
                64
            );
        case "plane":
            return new THREE.PlaneGeometry(
                (o.geometryParams as any)?.width ?? 1,
                (o.geometryParams as any)?.height ?? 1
            );
        case "custom": {
            const g = new THREE.BufferGeometry();
            return g;
        }
        default:
            return new THREE.BoxGeometry(1, 1, 1);
    }
}

function createObject(
    kind: GeometryKind,
    name?: string,
    params?: any
): SceneObject {
    return {
        id: nanoid(8),
        name: name ?? kind.charAt(0).toUpperCase() + kind.slice(1),
        geometry: kind,
        geometryParams: params,
        position: createVector3(),
        rotation: createEuler(),
        scale: createVector3(1, 1, 1),
        material: createDefaultMaterial(),
        visible: true,
        locked: false,
    };
}

function snapshot(state: EditorState): HistoryState {
    return {
        objects: JSON.parse(JSON.stringify(state.objects)),
        selectedId: state.selectedId,
    };
}

const initialState: EditorState & { isTransforming?: boolean } = {
    objects: [],
    selectedId: null,
    mode: "translate",
    snap: {
        enableSnapping: false,
        translateSnap: 0.5,
        rotateSnap: Math.PI / 12,
        scaleSnap: 0.1,
    },
    past: [],
    future: [],
    isTransforming: false,
};

interface EditorStore extends EditorState {
    addObject: (kind: GeometryKind, params?: any) => void;
    deleteSelected: () => void;
    duplicateSelected: () => void;
    select: (id: string | null) => void;
    setMode: (mode: TransformMode) => void;
    beginTransform: () => void;
    endTransform: () => void;
    updateTransform: (
        id: string,
        partial: Partial<Pick<SceneObject, "position" | "rotation" | "scale">>
    ) => void;
    updateMaterial: (
        id: string,
        partial: Partial<SceneObject["material"]>
    ) => void;
    updateGeometry: (id: string, kind: GeometryKind, params?: any) => void;
    toggleSnap: (enabled: boolean) => void;
    setSnap: (partial: Partial<SnapSettings>) => void;
    booleanOp: (
        op: "union" | "subtract" | "intersect",
        aId: string,
        bId: string
    ) => void;
    undo: () => void;
    redo: () => void;
    clear: () => void;
}

export const useEditor = create<EditorStore>()((set, get) => ({
    ...initialState,
    addObject: (kind, params) =>
        set((state) => {
            const newObj = createObject(kind, undefined, params);
            const next = produce(state, (draft) => {
                draft.past.push(snapshot(state));
                draft.future = [];
                draft.objects.push(newObj);
                draft.selectedId = newObj.id;
            });
            return next;
        }),
    deleteSelected: () =>
        set((state) => {
            if (!state.selectedId) return state;
            const next = produce(state, (draft) => {
                draft.past.push(snapshot(state));
                draft.future = [];
                draft.objects = draft.objects.filter(
                    (o) => o.id !== state.selectedId
                );
                draft.selectedId = null;
            });
            return next;
        }),
    duplicateSelected: () =>
        set((state) => {
            const id = state.selectedId;
            if (!id) return state;
            const original = state.objects.find((o) => o.id === id);
            if (!original) return state;
            const copy: SceneObject = JSON.parse(JSON.stringify(original));
            copy.id = nanoid(8);
            copy.name = original.name + " Copy";
            copy.position = {
                ...copy.position,
                x: copy.position.x + 0.5,
                y: copy.position.y + 0.5,
            };
            const next = produce(state, (draft) => {
                draft.past.push(snapshot(state));
                draft.future = [];
                draft.objects.push(copy);
                draft.selectedId = copy.id;
            });
            return next;
        }),
    select: (id) => set((state) => ({ ...state, selectedId: id })),
    setMode: (mode) => set((state) => ({ ...state, mode })),
    beginTransform: () =>
        set((state) => {
            if ((state as any).isTransforming) return state;
            const next = produce(state, (draft: any) => {
                draft.past.push(snapshot(state as unknown as EditorState));
                draft.future = [];
                draft.isTransforming = true;
            });
            return next;
        }),
    endTransform: () =>
        set((state) =>
            produce(state, (draft: any) => {
                draft.isTransforming = false;
            })
        ),
    updateTransform: (id, partial) =>
        set((state) => {
            const next = produce(state, (draft: any) => {
                const obj = draft.objects.find((o: SceneObject) => o.id === id);
                if (!obj) return;
                if (partial.position)
                    obj.position = { ...obj.position, ...partial.position };
                if (partial.rotation)
                    obj.rotation = { ...obj.rotation, ...partial.rotation };
                if (partial.scale)
                    obj.scale = { ...obj.scale, ...partial.scale };
            });
            return next;
        }),
    updateMaterial: (id, partial) =>
        set((state) =>
            produce(state, (draft) => {
                const obj = draft.objects.find((o) => o.id === id);
                if (obj) obj.material = { ...obj.material, ...partial };
            })
        ),
    updateGeometry: (id, kind, params) =>
        set((state) =>
            produce(state, (draft) => {
                const obj = draft.objects.find((o) => o.id === id);
                if (!obj) return;
                obj.geometry = kind;
                obj.geometryParams = params;
            })
        ),
    toggleSnap: (enabled) =>
        set((state) => ({
            ...state,
            snap: { ...state.snap, enableSnapping: enabled },
        })),
    setSnap: (partial) =>
        set((state) => ({ ...state, snap: { ...state.snap, ...partial } })),
    booleanOp: (op, aId, bId) =>
        set((state) => {
            const a = state.objects.find((o) => o.id === aId);
            const b = state.objects.find((o) => o.id === bId);
            if (!a || !b) return state;
            const ga = buildGeometryFromObject(a);
            const gb = buildGeometryFromObject(b);
            const ma = new THREE.Mesh(ga);
            ma.position.set(a.position.x, a.position.y, a.position.z);
            ma.rotation.set(a.rotation.x, a.rotation.y, a.rotation.z);
            ma.scale.set(a.scale.x, a.scale.y, a.scale.z);
            ma.updateMatrixWorld(true);

            const mb = new THREE.Mesh(gb);
            mb.position.set(b.position.x, b.position.y, b.position.z);
            mb.rotation.set(b.rotation.x, b.rotation.y, b.rotation.z);
            mb.scale.set(b.scale.x, b.scale.y, b.scale.z);
            mb.updateMatrixWorld(true);

            let result: THREE.Mesh;
            if (op === "union") result = CSG.union(ma, mb);
            else if (op === "subtract") result = CSG.subtract(ma, mb);
            else result = CSG.intersect(ma, mb);

            const resultGeom = (
                result.geometry as THREE.BufferGeometry
            ).clone();
            resultGeom.computeVertexNormals();
            const serial = serializeGeometry(resultGeom);

            const newObj = createObject("custom", "Boolean", serial);
            newObj.material = { ...a.material };

            const next = produce(state, (draft) => {
                draft.past.push(snapshot(state));
                draft.future = [];
                draft.objects.push(newObj);
                draft.selectedId = newObj.id;
            });
            return next;
        }),
    undo: () =>
        set((state) => {
            if (state.past.length === 0) return state;
            const prev = state.past[state.past.length - 1];
            const next = produce(state, (draft) => {
                draft.future.unshift({
                    objects: state.objects,
                    selectedId: state.selectedId,
                });
                draft.past = state.past.slice(0, -1);
                draft.objects = JSON.parse(JSON.stringify(prev.objects));
                draft.selectedId = prev.selectedId;
            });
            return next;
        }),
    redo: () =>
        set((state) => {
            if (state.future.length === 0) return state;
            const nextFuture = state.future[0];
            const next = produce(state, (draft) => {
                draft.past.push(snapshot(state));
                draft.future = state.future.slice(1);
                draft.objects = JSON.parse(JSON.stringify(nextFuture.objects));
                draft.selectedId = nextFuture.selectedId;
            });
            return next;
        }),
    clear: () => set(() => JSON.parse(JSON.stringify(initialState))),
}));
