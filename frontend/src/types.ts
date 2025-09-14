export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface Euler {
    x: number;
    y: number;
    z: number;
}

export type GeometryKind =
    | "box"
    | "sphere"
    | "cylinder"
    | "cone"
    | "torus"
    | "plane"
    | "custom";

export interface SerializableGeometry {
    positions: number[];
    indices?: number[];
    normals?: number[];
    uvs?: number[];
}

export interface GeometryParamsMap {
    box?: {
        width: number;
        height: number;
        depth: number;
        widthSegments?: number;
        heightSegments?: number;
        depthSegments?: number;
    };
    sphere?: {
        radius: number;
        widthSegments?: number;
        heightSegments?: number;
    };
    cylinder?: {
        radiusTop: number;
        radiusBottom: number;
        height: number;
        radialSegments?: number;
    };
    cone?: { radius: number; height: number; radialSegments?: number };
    torus?: {
        radius: number;
        tube: number;
        radialSegments?: number;
        tubularSegments?: number;
    };
    plane?: {
        width: number;
        height: number;
        widthSegments?: number;
        heightSegments?: number;
    };
    custom?: SerializableGeometry;
}

export interface MaterialProps {
    color: string;
    metalness: number;
    roughness: number;
    opacity: number;
    transparent: boolean;
}

export type LightType = "directional" | "point" | "spot" | "ambient";

export interface LightProps {
    color: string;
    intensity: number;
    distance?: number; // for point and spot lights
    angle?: number; // for spot lights
    penumbra?: number; // for spot lights
    decay?: number; // for point and spot lights
}

export interface SceneLight {
    id: string;
    name: string;
    type: LightType;
    position: Vector3;
    rotation: Euler; // for directional and spot lights
    props: LightProps;
    visible: boolean;
    castShadow: boolean;
}

export interface SceneObject {
    id: string;
    name: string;
    geometry: GeometryKind;
    geometryParams: GeometryParamsMap[keyof GeometryParamsMap] | undefined;
    position: Vector3;
    rotation: Euler; // radians
    scale: Vector3;
    material: MaterialProps;
    visible: boolean;
    locked: boolean;
}

export interface HistoryState {
    objects: SceneObject[];
    selectedId: string | null;
}

export type TransformMode = "translate" | "rotate" | "scale";

export type EditorMode = "object" | "edit" | "render";

export interface SnapSettings {
    enableSnapping: boolean;
    translateSnap: number; // units
    rotateSnap: number; // radians
    scaleSnap: number; // unit step
}

export interface Checkpoint {
    id: string;
    label: string;
    timestamp: number;
    prompt?: string;
    response?: string;
    state: HistoryState;
}

export interface EditorState {
    objects: SceneObject[];
    lights: SceneLight[];
    selectedId: string | null;
    mode: TransformMode;
    editorMode?: EditorMode;
    snap: SnapSettings;
    past: HistoryState[];
    future: HistoryState[];
    isTransforming?: boolean;
    checkpoints: Checkpoint[];
}
