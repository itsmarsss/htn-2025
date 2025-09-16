export type SceneEntityType = "mesh" | "light" | "camera" | "empty";

export type SceneSnapshot = {
    units: "meters";
    upAxis: "Y";
    counts: { meshes: number; lights: number; cameras: number };
    selection: string[];
    entities: Array<{
        id: string;
        name: string;
        type: SceneEntityType;
        parentId?: string;
        childrenIds?: string[];
        transform: {
            position: [number, number, number];
            rotation: [number, number, number];
            scale: [number, number, number];
        };
        geom?: {
            kind?: "cube" | "sphere" | "plane" | "cylinder";
            stats?: { vertices: number; triangles: number };
            bounds?: { min: [number, number, number]; max: [number, number, number] };
        };
        material?: {
            id: string;
            name: string;
            baseColorHex?: string;
            metalness?: number;
            roughness?: number;
        };
    }>;
    bounds?: { min: [number, number, number]; max: [number, number, number] };
    capabilities: string[];
};

export type Diff = {
    addedIds: string[];
    removedIds: string[];
    updatedIds: string[];
};

export type ToolResult = {
    success: boolean;
    diagnostics?: string[];
    snapshot?: SceneSnapshot;
    changes?: Diff;
    payload?: any;
};

export type ToolInvocation = {
    name:
        | "get_scene_summary"
        | "find"
        | "get_selection"
        | "create_primitive"
        | "select"
        | "transform"
        | "duplicate"
        | "delete"
        | "create_material"
        | "assign_material"
        | "export_glb"
        | "image_to_3d"
        | "update_name"; // small extension for rename
    args: any;
};

export type StepResult = {
    tool: ToolInvocation;
    ok: boolean;
    diagnostics?: string[];
    diff?: Diff;
}; 