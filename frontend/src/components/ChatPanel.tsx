import styled from "styled-components";
import { useMemo, useRef, useState } from "react";
import { useEditor } from "../store/editor";
import type { GeometryKind, SceneObject } from "../types";
import { importObjectsFromGLTF } from "../utils/io";

const SERVER_URL =
    (import.meta as any).env?.VITE_SERVER_URL ?? "http://localhost:8787";

const Panel = styled.div`
    position: absolute;
    top: 56px;
    bottom: 12px;
    right: 12px;
    width: 280px;
    background: rgba(18, 20, 26, 0.9);
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 50;
`;

const Header = styled.div`
    padding: 8px 12px;
    font-weight: 600;
    opacity: 0.9;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Toggle = styled.button`
    background: #12141a;
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 12px;
`;

const History = styled.div`
    max-height: 120px;
    overflow: auto;
    padding: 6px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const HistoryItem = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: space-between;
    background: rgba(30, 34, 44, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 6px 8px;
`;

const SmallBtn = styled.button`
    background: #0f1116;
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 4px 6px;
    font-size: 12px;
`;

const PinnedContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const PinnedControls = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`;

const PinnedList = styled.div`
    display: flex;
    gap: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 0;

    /* Hide scrollbars */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */

    &::-webkit-scrollbar {
        display: none; /* WebKit */
    }
`;

const PinnedItem = styled.span`
    font-size: 11px;
    background: rgba(30, 34, 44, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 2px 6px;
    white-space: nowrap;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const Messages = styled.div`
    flex: 1;
    padding: 8px 12px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const Message = styled.div<{ role: "user" | "system" }>`
    align-self: ${(p) => (p.role === "user" ? "flex-end" : "flex-start")};
    background: ${(p) =>
        p.role === "user" ? "rgba(60, 65, 80, 0.6)" : "rgba(30, 34, 44, 0.8)"};
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e9ef;
    padding: 6px 10px;
    border-radius: 10px;
    max-width: 70%;
    white-space: pre-wrap;
`;

const InputRow = styled.form`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    padding: 8px 8px 10px 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const TextInput = styled.input`
    background: #0f1116;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e9ef;
    border-radius: 10px;
    padding: 8px 10px;
`;

const SendBtn = styled.button`
    background: rgba(18, 20, 26, 0.9);
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 8px 12px;
`;

const AttachBtn = styled.button`
    background: rgba(18, 20, 26, 0.9);
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 8px 12px;
`;

type ChatMsg = { role: "user" | "system"; text: string };

function toRadians(value: number) {
    return (value * Math.PI) / 180;
}

function parseNumber(s: string | undefined, fallback: number) {
    if (s == null) return fallback;
    const v = parseFloat(s);
    return Number.isFinite(v) ? v : fallback;
}

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || "");
            const base64 = result.includes(",") ? result.split(",")[1] : result;
            resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

const COLOR_NAMES: Record<string, string> = {
    red: "#ff4d4f",
    green: "#52c41a",
    blue: "#1890ff",
    yellow: "#fadb14",
    orange: "#fa8c16",
    purple: "#722ed1",
    pink: "#eb2f96",
    white: "#ffffff",
    black: "#000000",
    gray: "#8c8c8c",
};

export function ChatPanel() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMsg[]>([
        {
            role: "system",
            text: 'Try: "add box", "move x 1 y 0 z -0.5", "rotate y 45", "scale 1.5", "color red", "delete", "duplicate", "select Sphere", "union A B", "undo"',
        },
    ]);
    const [showHistory, setShowHistory] = useState(true);
    const [usingLLM, setUsingLLM] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [pinnedIds, setPinnedIds] = useState<string[]>([]);

    const objects = useEditor((s) => s.objects);
    const selectedId = useEditor((s) => s.selectedId);
    const addObject = useEditor((s) => s.addObject);
    const deleteSelected = useEditor((s) => s.deleteSelected);
    const duplicateSelected = useEditor((s) => s.duplicateSelected);
    const select = useEditor((s) => s.select);
    const setMode = useEditor((s) => s.setMode);
    const updateTransform = useEditor((s) => s.updateTransform);
    const updateMaterial = useEditor((s) => s.updateMaterial);
    const updateGeometry = useEditor((s) => s.updateGeometry);
    const booleanOp = useEditor((s) => s.booleanOp);
    const undo = useEditor((s) => s.undo);
    const redo = useEditor((s) => s.redo);
    const toggleSnap = useEditor((s) => s.toggleSnap);
    const setSnap = useEditor((s) => s.setSnap);
    const addCheckpoint = useEditor((s) => s.addCheckpoint);
    const checkpoints = useEditor((s) => s.checkpoints);
    const restoreCheckpoint = useEditor((s) => s.restoreCheckpoint);
    const deleteCheckpoint = useEditor((s) => s.deleteCheckpoint);
    const addSceneObjects = (useEditor as any).getState?.().addSceneObjects;

    const selected = useMemo(
        () => objects.find((o) => o.id === selectedId) ?? null,
        [objects, selectedId]
    );
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function push(role: ChatMsg["role"], text: string) {
        setMessages((prev) => [...prev, { role, text }]);
        queueMicrotask(() => {
            const el = scrollRef.current;
            if (el) el.scrollTop = el.scrollHeight;
        });
    }

    function pinSelected() {
        if (!selectedId) return;
        setPinnedIds((prev) =>
            prev.includes(selectedId) ? prev : [...prev, selectedId]
        );
    }

    function unpin(id: string) {
        setPinnedIds((prev) => prev.filter((x) => x !== id));
    }

    function clearPins() {
        setPinnedIds([]);
    }

    function ensurePinned(add: string | string[]) {
        setPinnedIds((prev) => {
            const next = new Set(prev);
            if (Array.isArray(add)) {
                for (const id of add) if (id) next.add(id);
            } else if (add) {
                next.add(add);
            }
            return Array.from(next);
        });
    }

    function calculateSceneBounds(objects: SceneObject[]) {
        if (objects.length === 0) {
            return {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 0, y: 0, z: 0 }
            };
        }

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        objects.forEach(obj => {
            const p: any = obj.geometryParams || {};
            const kind = obj.geometry;
            
            // Calculate effective dimensions
            const eff = {
                width: kind === "box" ? (p.width ?? 1) * obj.scale.x
                    : kind === "sphere" ? 2 * (p.radius ?? 0.5) * obj.scale.x
                    : kind === "cylinder" ? 2 * Math.max(p.radiusTop ?? p.radius ?? 0.5, p.radiusBottom ?? p.radius ?? 0.5) * obj.scale.x
                    : kind === "cone" ? 2 * (p.radius ?? 0.5) * obj.scale.x
                    : kind === "torus" ? 2 * (p.radius ?? 0.5) * obj.scale.x
                    : kind === "plane" ? (p.width ?? 1) * obj.scale.x
                    : 1,
                height: kind === "box" ? (p.height ?? 1) * obj.scale.y
                    : kind === "sphere" ? 2 * (p.radius ?? 0.5) * obj.scale.y
                    : kind === "cylinder" ? (p.height ?? 1) * obj.scale.y
                    : kind === "cone" ? (p.height ?? 1) * obj.scale.y
                    : kind === "torus" ? 2 * (p.radius ?? 0.5) * obj.scale.y
                    : kind === "plane" ? (p.height ?? 1) * obj.scale.y
                    : 1,
                depth: kind === "box" ? (p.depth ?? 1) * obj.scale.z
                    : kind === "sphere" ? 2 * (p.radius ?? 0.5) * obj.scale.z
                    : kind === "cylinder" ? 2 * Math.max(p.radiusTop ?? p.radius ?? 0.5, p.radiusBottom ?? p.radius ?? 0.5) * obj.scale.z
                    : kind === "cone" ? 2 * (p.radius ?? 0.5) * obj.scale.z
                    : kind === "torus" ? 2 * (p.radius ?? 0.5) * obj.scale.z
                    : kind === "plane" ? 0
                    : 1,
            };

            // Calculate bounding box corners
            const halfWidth = eff.width / 2;
            const halfHeight = eff.height / 2;
            const halfDepth = eff.depth / 2;

            const corners = [
                { x: obj.position.x - halfWidth, y: obj.position.y - halfHeight, z: obj.position.z - halfDepth },
                { x: obj.position.x + halfWidth, y: obj.position.y - halfHeight, z: obj.position.z - halfDepth },
                { x: obj.position.x - halfWidth, y: obj.position.y + halfHeight, z: obj.position.z - halfDepth },
                { x: obj.position.x + halfWidth, y: obj.position.y + halfHeight, z: obj.position.z - halfDepth },
                { x: obj.position.x - halfWidth, y: obj.position.y - halfHeight, z: obj.position.z + halfDepth },
                { x: obj.position.x + halfWidth, y: obj.position.y - halfHeight, z: obj.position.z + halfDepth },
                { x: obj.position.x - halfWidth, y: obj.position.y + halfHeight, z: obj.position.z + halfDepth },
                { x: obj.position.x + halfWidth, y: obj.position.y + halfHeight, z: obj.position.z + halfDepth },
            ];

            corners.forEach(corner => {
                minX = Math.min(minX, corner.x);
                minY = Math.min(minY, corner.y);
                minZ = Math.min(minZ, corner.z);
                maxX = Math.max(maxX, corner.x);
                maxY = Math.max(maxY, corner.y);
                maxZ = Math.max(maxZ, corner.z);
            });
        });

        return {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ }
        };
    }

    function summarizeObjectDetailed(o: SceneObject) {
        const kind = o.geometry;
        const p: any = o.geometryParams || {};
        const eff = {
            width:
                kind === "box"
                    ? (p.width ?? 1) * o.scale.x
                    : kind === "sphere"
                    ? 2 * (p.radius ?? 0.5) * o.scale.x
                    : kind === "cylinder"
                    ? 2 *
                      Math.max(
                          p.radiusTop ?? p.radius ?? 0.5,
                          p.radiusBottom ?? p.radius ?? 0.5
                      ) *
                      o.scale.x
                    : kind === "cone"
                    ? 2 * (p.radius ?? 0.5) * o.scale.x
                    : kind === "torus"
                    ? 2 * (p.radius ?? 0.5) * o.scale.x
                    : kind === "plane"
                    ? (p.width ?? 1) * o.scale.x
                    : 1,
            height:
                kind === "box"
                    ? (p.height ?? 1) * o.scale.y
                    : kind === "sphere"
                    ? 2 * (p.radius ?? 0.5) * o.scale.y
                    : kind === "cylinder"
                    ? (p.height ?? 1) * o.scale.y
                    : kind === "cone"
                    ? (p.height ?? 1) * o.scale.y
                    : kind === "torus"
                    ? 2 * (p.radius ?? 0.5) * o.scale.y
                    : kind === "plane"
                    ? (p.height ?? 1) * o.scale.y
                    : 1,
            depth:
                kind === "box"
                    ? (p.depth ?? 1) * o.scale.z
                    : kind === "sphere"
                    ? 2 * (p.radius ?? 0.5) * o.scale.z
                    : kind === "cylinder"
                    ? 2 *
                      Math.max(
                          p.radiusTop ?? p.radius ?? 0.5,
                          p.radiusBottom ?? p.radius ?? 0.5
                      ) *
                      o.scale.z
                    : kind === "cone"
                    ? 2 * (p.radius ?? 0.5) * o.scale.z
                    : kind === "torus"
                    ? 2 * (p.radius ?? 0.5) * o.scale.z
                    : kind === "plane"
                    ? 0
                    : 1,
        };
        const dims = `dims=(${eff.width.toFixed(2)}×${eff.height.toFixed(
            2
        )}×${eff.depth.toFixed(2)})`;
        return `${o.name} [${
            o.id
        }] kind=${kind} ${dims} pos=(${o.position.x.toFixed(
            2
        )},${o.position.y.toFixed(2)},${o.position.z.toFixed(
            2
        )}) rot=(${o.rotation.x.toFixed(2)},${o.rotation.y.toFixed(
            2
        )},${o.rotation.z.toFixed(2)}) scale=(${o.scale.x.toFixed(
            2
        )},${o.scale.y.toFixed(2)},${o.scale.z.toFixed(2)}) color=${
            o.material.color
        }`;
    }

    async function callLLM(userText: string, attached?: File | null) {
        try {
            setIsLoading(true);
            
            // Enhanced scene summary with spatial context
            const sceneBounds = calculateSceneBounds(objects);
            const sceneSummary = objects.length > 0 
                ? `Scene contains ${objects.length} objects. Scene bounds: x[${sceneBounds.min.x.toFixed(1)}, ${sceneBounds.max.x.toFixed(1)}], y[${sceneBounds.min.y.toFixed(1)}, ${sceneBounds.max.y.toFixed(1)}], z[${sceneBounds.min.z.toFixed(1)}, ${sceneBounds.max.z.toFixed(1)}]. Objects: ` +
                  objects
                      .map(
                          (o) =>
                              `${o.name} [${o.id}] kind=${o.geometry} pos=(${o.position.x.toFixed(2)},${o.position.y.toFixed(2)},${o.position.z.toFixed(2)}) size=(${o.scale.x.toFixed(2)},${o.scale.y.toFixed(2)},${o.scale.z.toFixed(2)})`
                      )
                      .join("; ")
                : "Empty scene - no objects present.";

            const pinned = pinnedIds
                .map((id) => objects.find((o) => o.id === id))
                .filter(Boolean) as SceneObject[];
            const focusContext = pinned.length
                ? pinned.map((o) => summarizeObjectDetailed(o)).join("; ")
                : "";

            let attachmentPayload: any = undefined;
            if (attached) {
                try {
                    const data = await fileToBase64(attached);
                    attachmentPayload = {
                        name: attached.name,
                        type: attached.type,
                        size: attached.size,
                        data,
                    };
                } catch {}
            }

            const r = await fetch(`${SERVER_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user: userText,
                    sceneSummary,
                    focusContext,
                    attachment: attachmentPayload,
                }),
            });
            const data = await r.json();
            // OpenAI-compatible: choices[0].message
            const msg = data?.choices?.[0]?.message;
            if (!msg) return { executed: false, reply: "No response" };

            // If tool call present
            const tool = msg?.tool_calls?.[0];
            if (tool?.function?.name) {
                const name = tool.function.name as string;
                let args: any = {};
                try {
                    args = tool.function.arguments
                        ? JSON.parse(tool.function.arguments)
                        : {};
                } catch {}

                // map tools to store actions
                if (name === "addObject") {
                    addObject(args.kind as GeometryKind, args.params);
                    const st = (useEditor as any).getState?.() || {};
                    if (st.selectedId) ensurePinned(st.selectedId);
                    return { executed: true, reply: `Added ${args.kind}` };
                }
                if (name === "generateModelRodin") {
                    try {
                        const pre = new Set(
                            ((useEditor as any).getState?.().objects ?? []).map(
                                (o: any) => o.id
                            )
                        );
                        const body = {
                            imageUrl: args.imageUrl,
                            prompt: args.prompt,
                            quality: args.quality,
                            material: args.material,
                        };
                        const rr = await fetch(`${SERVER_URL}/api/rodin`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        });
                        const jd = await rr.json();
                        const glbUrl = jd?.glbUrl;
                        if (!glbUrl)
                            return { executed: false, reply: "Rodin failed" };
                        const resp = await fetch(glbUrl);
                        if (!resp.ok)
                            return {
                                executed: false,
                                reply: "Fetch GLB failed",
                            };
                        const blob = await resp.blob();
                        const file = new File([blob], "rodin.glb", {
                            type: blob.type || "model/gltf-binary",
                        });
                        const objs = await importObjectsFromGLTF(file);
                        if (addSceneObjects) addSceneObjects(objs);
                        const postObjs =
                            (useEditor as any).getState?.().objects ?? [];
                        const newIds = postObjs
                            .filter((o: any) => !pre.has(o.id))
                            .map((o: any) => o.id);
                        if (newIds.length) ensurePinned(newIds);
                        return {
                            executed: true,
                            reply: `Imported ${objs.length} object(s)`,
                        };
                    } catch {
                        return {
                            executed: false,
                            reply: "Rodin import failed",
                        };
                    }
                }
                if (name === "selectObject") {
                    const t = String(args.target || "");
                    const found = objects.find(
                        (o) => o.id === t || o.name === t
                    );
                    if (found) {
                        select(found.id);
                        return {
                            executed: true,
                            reply: `Selected ${found.name}`,
                        };
                    }
                    return { executed: false, reply: `Object not found: ${t}` };
                }
                if (name === "updateTransform") {
                    const id = args.id || selectedId;
                    if (!id)
                        return {
                            executed: false,
                            reply: "No target for transform",
                        };
                    const obj = objects.find((o) => o.id === id);
                    if (!obj)
                        return { executed: false, reply: "Target not found" };
                    const isDelta = !!args.isDelta;
                    const position = args.position
                        ? {
                              x: isDelta
                                  ? obj.position.x + (args.position.x ?? 0)
                                  : args.position.x ?? obj.position.x,
                              y: isDelta
                                  ? obj.position.y + (args.position.y ?? 0)
                                  : args.position.y ?? obj.position.y,
                              z: isDelta
                                  ? obj.position.z + (args.position.z ?? 0)
                                  : args.position.z ?? obj.position.z,
                          }
                        : undefined;
                    const rotation = args.rotation
                        ? {
                              x: isDelta
                                  ? obj.rotation.x + (args.rotation.x ?? 0)
                                  : args.rotation.x ?? obj.rotation.x,
                              y: isDelta
                                  ? obj.rotation.y + (args.rotation.y ?? 0)
                                  : args.rotation.y ?? obj.rotation.y,
                              z: isDelta
                                  ? obj.rotation.z + (args.rotation.z ?? 0)
                                  : args.rotation.z ?? obj.rotation.z,
                          }
                        : undefined;
                    const scale = args.scale
                        ? {
                              x: isDelta
                                  ? obj.scale.x * (args.scale.x ?? 1)
                                  : args.scale.x ?? obj.scale.x,
                              y: isDelta
                                  ? obj.scale.y * (args.scale.y ?? 1)
                                  : args.scale.y ?? obj.scale.y,
                              z: isDelta
                                  ? obj.scale.z * (args.scale.z ?? 1)
                                  : args.scale.z ?? obj.scale.z,
                          }
                        : undefined;
                    updateTransform(id, { position, rotation, scale });
                    return { executed: true, reply: "Transform updated" };
                }
                if (name === "updateMaterial") {
                    const id = args.id || selectedId;
                    if (!id)
                        return {
                            executed: false,
                            reply: "No target for material",
                        };
                    updateMaterial(id, {
                        color: args.color,
                        metalness: args.metalness,
                        roughness: args.roughness,
                        opacity: args.opacity,
                        transparent: args.transparent,
                    });
                    return { executed: true, reply: "Material updated" };
                }
                if (name === "updateGeometry") {
                    const candidate = args.id ?? args.target ?? selectedId;
                    const id = resolveId(candidate) ?? null;
                    if (!id)
                        return {
                            executed: false,
                            reply: "No target for geometry",
                        };
                    updateGeometry(id, args.kind as GeometryKind, args.params);
                    return {
                        executed: true,
                        reply: `Geometry set to ${args.kind}`,
                    };
                }
                if (name === "updateName") {
                    console.log("updateName called with args:", args);
                    const candidate = args.id ?? args.target ?? selectedId;
                    const id = resolveId(candidate) ?? null;
                    const newName = String(args.name || "").trim();
                    console.log(
                        "updateName - candidate:",
                        candidate,
                        "id:",
                        id,
                        "newName:",
                        newName
                    );
                    if (!id || !newName)
                        return { executed: false, reply: "Missing id or name" };
                    const updateNameStore = (useEditor as any).getState?.()
                        .updateName;
                    if (updateNameStore) updateNameStore(id, newName);
                    return { executed: true, reply: `Renamed to ${newName}` };
                }
                if (name === "updateNamesBulk") {
                    console.log("updateNamesBulk called with args:", args);
                    const names = args.names || [];
                    const targetIds =
                        args.targetIds ||
                        (window as any).lastCreatedObjectIds ||
                        [];
                    console.log(
                        "updateNamesBulk - names:",
                        names,
                        "targetIds:",
                        targetIds
                    );

                    if (
                        !Array.isArray(names) ||
                        !Array.isArray(targetIds) ||
                        names.length !== targetIds.length
                    ) {
                        return {
                            executed: false,
                            reply: "Mismatch between names and target IDs",
                        };
                    }

                    const updateNameStore = (useEditor as any).getState?.()
                        .updateName;
                    if (!updateNameStore) {
                        return {
                            executed: false,
                            reply: "Update name function not available",
                        };
                    }

                    let renamed = 0;
                    for (
                        let i = 0;
                        i < Math.min(names.length, targetIds.length);
                        i++
                    ) {
                        const name = String(names[i] || "").trim();
                        const id = String(targetIds[i] || "").trim();
                        if (name && id) {
                            updateNameStore(id, name);
                            renamed++;
                        }
                    }

                    return {
                        executed: true,
                        reply: `Renamed ${renamed} objects`,
                    };
                }
                if (name === "duplicateSelected") {
                    duplicateSelected();
                    const st = (useEditor as any).getState?.() || {};
                    if (st.selectedId) ensurePinned(st.selectedId);
                    return { executed: true, reply: "Duplicated" };
                }
                if (name === "deleteSelected") {
                    deleteSelected();
                    return { executed: true, reply: "Deleted" };
                }
                if (name === "booleanOp") {
                    booleanOp(args.op, args.a, args.b);
                    const st = (useEditor as any).getState?.() || {};
                    if (st.selectedId) ensurePinned(st.selectedId);
                    return { executed: true, reply: `Boolean ${args.op}` };
                }
                if (name === "undo") {
                    undo();
                    return { executed: true, reply: "Undid last action" };
                }
                if (name === "redo") {
                    redo();
                    return { executed: true, reply: "Redid last action" };
                }
                if (name === "toggleSnap") {
                    toggleSnap(!!args.enabled);
                    return {
                        executed: true,
                        reply: `Snapping ${
                            args.enabled ? "enabled" : "disabled"
                        }`,
                    };
                }
                if (name === "setSnap") {
                    setSnap({
                        translateSnap: args.translateSnap,
                        rotateSnap: args.rotateSnap,
                        scaleSnap: args.scaleSnap,
                    });
                    return { executed: true, reply: "Snap updated" };
                }
                if (name === "setMode") {
                    setMode(args.mode);
                    return { executed: true, reply: `Mode: ${args.mode}` };
                }
                if (name === "addRepeatedObjects") {
                    const kind = args.kind as GeometryKind;
                    const count = Math.max(1, Number(args.count || 1));
                    const params = args.params;
                    const sx = Number(
                        args.spacingX ??
                            (params?.width ?? params?.radius ?? 1.0) * 1.2
                    );
                    const sy = Number(args.spacingY ?? 0);
                    const sz = Number(args.spacingZ ?? 0);
                    const startX = Number(args.startX ?? 0);
                    const startY = Number(args.startY ?? 0);
                    const startZ = Number(args.startZ ?? 0);
                    let created = 0;
                    const createdIds: string[] = [];

                    for (let i = 0; i < count; i++) {
                        addObject(kind, params);
                        const state = (useEditor as any).getState?.() || {};
                        const id = state.selectedId as string | undefined;
                        if (id) {
                            updateTransform(id, {
                                position: {
                                    x: startX + i * sx,
                                    y: startY + i * sy,
                                    z: startZ + i * sz,
                                },
                            });
                            ensurePinned(id);
                            createdIds.push(id);
                            created++;
                        }
                    }

                    // Store the created IDs in a global variable for potential bulk operations
                    (window as any).lastCreatedObjectIds = createdIds;

                    return {
                        executed: true,
                        reply: `Added ${created} ${kind}(s)`,
                    };
                }
                if (name === "scatterObjects") {
                    const kind = args.kind as GeometryKind;
                    const count = Math.max(1, Number(args.count || 1));
                    const params = args.params;
                    const areaWidth = Number(args.areaWidth || 10);
                    const areaHeight = Number(args.areaHeight || 10);
                    const areaDepth = Number(args.areaDepth || 10);
                    const centerX = Number(args.centerX || 0);
                    const centerY = Number(args.centerY || 0);
                    const centerZ = Number(args.centerZ || 0);
                    
                    let created = 0;
                    const createdIds: string[] = [];
                    
                    for (let i = 0; i < count; i++) {
                        addObject(kind, params);
                        const state = (useEditor as any).getState?.() || {};
                        const id = state.selectedId as string | undefined;
                        if (id) {
                            // Generate random position within the specified area
                            const x = centerX + (Math.random() - 0.5) * areaWidth;
                            const y = centerY + (Math.random() - 0.5) * areaHeight;
                            const z = centerZ + (Math.random() - 0.5) * areaDepth;
                            
                            updateTransform(id, {
                                position: { x, y, z }
                            });
                            ensurePinned(id);
                            createdIds.push(id);
                            created++;
                        }
                    }
                    
                    // Store the created IDs for potential bulk operations
                    (window as any).lastCreatedObjectIds = createdIds;
                    
                    return {
                        executed: true,
                        reply: `Scattered ${created} ${kind}(s) in ${areaWidth}×${areaHeight}×${areaDepth} area centered at (${centerX}, ${centerY}, ${centerZ})`,
                    };
                }
                if (name === "updateTransformMany") {
                    const items: any[] = Array.isArray(args.items)
                        ? args.items
                        : [];
                    let applied = 0;
                    for (const it of items) {
                        const t = String(it.id || it.target || "");
                        const obj = objects.find(
                            (o) => o.id === t || o.name === t
                        );
                        if (!obj) continue;
                        const isDelta = !!it.isDelta;
                        const position = it.position
                            ? {
                                  x: isDelta
                                      ? obj.position.x + (it.position.x ?? 0)
                                      : it.position.x ?? obj.position.x,
                                  y: isDelta
                                      ? obj.position.y + (it.position.y ?? 0)
                                      : it.position.y ?? obj.position.y,
                                  z: isDelta
                                      ? obj.position.z + (it.position.z ?? 0)
                                      : it.position.z ?? obj.position.z,
                              }
                            : undefined;
                        const rotation = it.rotation
                            ? {
                                  x: isDelta
                                      ? obj.rotation.x + (it.rotation.x ?? 0)
                                      : it.rotation.x ?? obj.rotation.x,
                                  y: isDelta
                                      ? obj.rotation.y + (it.rotation.y ?? 0)
                                      : it.rotation.y ?? obj.rotation.y,
                                  z: isDelta
                                      ? obj.rotation.z + (it.rotation.z ?? 0)
                                      : it.rotation.z ?? obj.rotation.z,
                              }
                            : undefined;
                        const scale = it.scale
                            ? {
                                  x: isDelta
                                      ? obj.scale.x * (it.scale.x ?? 1)
                                      : it.scale.x ?? obj.scale.x,
                                  y: isDelta
                                      ? obj.scale.y * (it.scale.y ?? 1)
                                      : it.scale.y ?? obj.scale.y,
                                  z: isDelta
                                      ? obj.scale.z * (it.scale.z ?? 1)
                                      : it.scale.z ?? obj.scale.z,
                              }
                            : undefined;
                        updateTransform(obj.id, { position, rotation, scale });
                        applied++;
                    }
                    return {
                        executed: applied > 0,
                        reply: `Updated ${applied} object(s)`,
                    };
                }
                if (name === "updateMaterialMany") {
                    const items: any[] = Array.isArray(args.items)
                        ? args.items
                        : [];
                    let applied = 0;
                    for (const it of items) {
                        const t = String(it.id || it.target || "");
                        const obj = objects.find(
                            (o) => o.id === t || o.name === t
                        );
                        if (!obj) continue;
                        updateMaterial(obj.id, {
                            color: it.color,
                            metalness: it.metalness,
                            roughness: it.roughness,
                            opacity: it.opacity,
                            transparent: it.transparent,
                        });
                        applied++;
                    }
                    return {
                        executed: applied > 0,
                        reply: `Material updated on ${applied} object(s)`,
                    };
                }
            }

            const text = msg?.content ?? "Ok";
            return { executed: false, reply: text };
        } catch (e) {
            return { executed: false, reply: "LLM call failed" };
        } finally {
            setIsLoading(false);
        }
    }

    function checkpoint(prompt: string, response: string) {
        addCheckpoint({ prompt, response, label: prompt.slice(0, 40) });
    }

    function findByNameOrId(nameOrId: string): SceneObject | undefined {
        const lower = nameOrId.toLowerCase();
        return objects.find(
            (o) =>
                o.id.toLowerCase() === lower || o.name.toLowerCase() === lower
        );
    }

    function resolveId(nameOrId: string): string | undefined {
        const obj = findByNameOrId(nameOrId);
        return obj ? obj.id : undefined;
    }

    function parseAddParams(kind: GeometryKind, rest: string): any | undefined {
        const get = (key: string) => {
            const m = rest.match(new RegExp(`${key}\\s+(-?\\d*\\.?\\d+)`, "i"));
            return m ? parseFloat(m[1]) : undefined;
        };
        if (kind === "box")
            return {
                width: get("width") ?? 1,
                height: get("height") ?? 1,
                depth: get("depth") ?? 1,
            };
        if (kind === "sphere") return { radius: get("radius") ?? 0.5 };
        if (kind === "cylinder")
            return {
                radiusTop: get("radiustop") ?? get("radius") ?? 0.5,
                radiusBottom: get("radiusbottom") ?? get("radius") ?? 0.5,
                height: get("height") ?? 1,
            };
        if (kind === "cone")
            return { radius: get("radius") ?? 0.5, height: get("height") ?? 1 };
        if (kind === "torus")
            return { radius: get("radius") ?? 0.5, tube: get("tube") ?? 0.2 };
        if (kind === "plane")
            return { width: get("width") ?? 1, height: get("height") ?? 1 };
        return undefined;
    }

    function handleCommand(raw: string) {
        const text = raw.trim();
        if (!text) return;
        push("user", text);

        if (usingLLM) {
            callLLM(text, attachment).then(({ executed, reply }) => {
                push("system", reply);
                if (executed) checkpoint(text, reply);
                else fallbackParse(text);
            });
            return;
        }

        fallbackParse(text);
    }

    function fallbackParse(text: string) {
        const lc = text.toLowerCase();
        let sys = "";

        // mode
        if (/^mode\s+(translate|rotate|scale)/i.test(lc)) {
            const m = lc.match(/^mode\s+(translate|rotate|scale)/i);
            if (m) {
                setMode(m[1] as any);
                sys = `Mode set to ${m[1]}`;
                push("system", sys);
                checkpoint(text, sys);
                return;
            }
        }

        // snapping
        if (/^(enable|disable)\s+snapping/.test(lc)) {
            toggleSnap(lc.startsWith("enable"));
            sys = `Snapping ${
                lc.startsWith("enable") ? "enabled" : "disabled"
            }`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }
        if (/^snap\s+/.test(lc)) {
            const ts = lc.match(/translate\s+(-?\d*\.?\d+)/);
            const rs = lc.match(/rotate\s+(-?\d*\.?\d+)/);
            const ss = lc.match(/scale\s+(-?\d*\.?\d+)/);
            if (ts) setSnap({ translateSnap: parseFloat(ts[1]) });
            if (rs)
                setSnap({ rotateSnap: (parseFloat(rs[1]) * Math.PI) / 180 });
            if (ss) setSnap({ scaleSnap: parseFloat(ss[1]) });
            sys = "Snap updated";
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // undo/redo/clear
        if (lc === "undo") {
            undo();
            sys = "Undid last action";
            push("system", sys);
            checkpoint(text, sys);
            return;
        }
        if (lc === "redo") {
            redo();
            sys = "Redid last action";
            push("system", sys);
            checkpoint(text, sys);
            return;
        }
        if (lc === "clear" || lc === "reset scene") {
            window.location.reload();
            return;
        }

        // add object
        const addMatch = lc.match(
            /^add\s+(box|sphere|cylinder|cone|torus|plane)(.*)$/
        );
        if (addMatch) {
            const kind = addMatch[1] as GeometryKind;
            const params = parseAddParams(kind, addMatch[2] ?? "");
            addObject(kind, params);
            try {
                const st = (useEditor as any).getState?.() || {};
                if (st.selectedId) ensurePinned(st.selectedId);
            } catch {}
            sys = `Added ${kind}${params ? " with params" : ""}`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // delete / duplicate
        if (/^(delete|remove|del)$/.test(lc)) {
            if (!selected) {
                sys = "Nothing selected";
                push("system", sys);
                return;
            }
            deleteSelected();
            sys = "Deleted selected object";
            push("system", sys);
            checkpoint(text, sys);
            return;
        }
        if (/^(duplicate|copy|dup)$/.test(lc)) {
            if (!selected) {
                sys = "Nothing selected";
                push("system", sys);
                return;
            }
            duplicateSelected();
            try {
                const st = (useEditor as any).getState?.() || {};
                if (st.selectedId) ensurePinned(st.selectedId);
            } catch {}
            sys = "Duplicated selected object";
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // select by name
        const selByName = lc.match(/^select\s+(.+)$/);
        if (selByName) {
            const name = selByName[1].trim();
            const obj = findByNameOrId(name);
            if (obj) {
                select(obj.id);
                sys = `Selected ${obj.name}`;
                push("system", sys);
                checkpoint(text, sys);
            } else {
                sys = `Could not find object "${name}"`;
                push("system", sys);
            }
            return;
        }

        // color / material
        const colorMatch = lc.match(/(?:color|colour)\s+([^\s]+)/);
        if (colorMatch && selected) {
            const rawColor = colorMatch[1];
            const hex = COLOR_NAMES[rawColor] ?? rawColor;
            updateMaterial(selected.id, { color: hex });
            sys = `Set color to ${hex}`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        const opacityMatch = lc.match(/opacity\s+(-?\d*\.?\d+)/);
        if (opacityMatch && selected) {
            const v = parseNumber(opacityMatch[1], 1);
            updateMaterial(selected.id, { opacity: v, transparent: v < 1 });
            sys = `Set opacity to ${v}`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        const metalMatch = lc.match(/metal(ness)?\s+(-?\d*\.?\d+)/);
        if (metalMatch && selected) {
            const v = parseNumber(metalMatch[2], 0.1);
            updateMaterial(selected.id, { metalness: v });
            sys = `Set metalness to ${v}`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        const roughMatch = lc.match(/rough(ness)?\s+(-?\d*\.?\d+)/);
        if (roughMatch && selected) {
            const v = parseNumber(roughMatch[2], 0.8);
            updateMaterial(selected.id, { roughness: v });
            sys = `Set roughness to ${v}`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // move / translate (relative)
        const moveMatch = lc.match(/^(move|translate)\b(.*)$/);
        if (moveMatch && selected) {
            const rest = moveMatch[2];
            const dx = parseNumber(rest.match(/x\s+(-?\d*\.?\d+)/)?.[1], 0);
            const dy = parseNumber(rest.match(/y\s+(-?\d*\.?\d+)/)?.[1], 0);
            const dz = parseNumber(rest.match(/z\s+(-?\d*\.?\d+)/)?.[1], 0);
            updateTransform(selected.id, {
                position: {
                    x: selected.position.x + dx,
                    y: selected.position.y + dy,
                    z: selected.position.z + dz,
                },
            });
            sys = `Moved by (${dx}, ${dy}, ${dz})`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // set position absolute: position x 1 y 2 z 3
        const posMatch = lc.match(/^pos(ition)?\b(.*)$/);
        if (posMatch && selected) {
            const rest = posMatch[2];
            const x = parseNumber(
                rest.match(/x\s+(-?\d*\.?\d+)/)?.[1],
                selected.position.x
            );
            const y = parseNumber(
                rest.match(/y\s+(-?\d*\.?\d+)/)?.[1],
                selected.position.y
            );
            const z = parseNumber(
                rest.match(/z\s+(-?\d*\.?\d+)/)?.[1],
                selected.position.z
            );
            updateTransform(selected.id, { position: { x, y, z } });
            sys = `Position set to (${x}, ${y}, ${z})`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // rotate
        const rotMatch = lc.match(/^rot(ate)?\b(.*)$/);
        if (rotMatch && selected) {
            const rest = rotMatch[2];
            const hasDeg = /deg/.test(rest);
            const rxRaw = rest.match(/x\s+(-?\d*\.?\d+)/)?.[1];
            const ryRaw = rest.match(/y\s+(-?\d*\.?\d+)/)?.[1];
            const rzRaw = rest.match(/z\s+(-?\d*\.?\d+)/)?.[1];
            const rx = rxRaw
                ? hasDeg
                    ? toRadians(parseFloat(rxRaw))
                    : parseFloat(rxRaw)
                : 0;
            const ry = ryRaw
                ? hasDeg
                    ? toRadians(parseFloat(ryRaw))
                    : parseFloat(ryRaw)
                : 0;
            const rz = rzRaw
                ? hasDeg
                    ? toRadians(parseFloat(rzRaw))
                    : parseFloat(rzRaw)
                : 0;
            updateTransform(selected.id, {
                rotation: {
                    x: selected.rotation.x + rx,
                    y: selected.rotation.y + ry,
                    z: selected.rotation.z + rz,
                },
            });
            sys = `Rotated by (${rx.toFixed(3)}, ${ry.toFixed(3)}, ${rz.toFixed(
                3
            )}) rad`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // scale
        const scaleMatch = lc.match(/^scale\b(.*)$/);
        if (scaleMatch && selected) {
            const rest = scaleMatch[1];
            const sxRaw = rest.match(/x\s+(-?\d*\.?\d+)/)?.[1];
            const syRaw = rest.match(/y\s+(-?\d*\.?\d+)/)?.[1];
            const szRaw = rest.match(/z\s+(-?\d*\.?\d+)/)?.[1];
            const uniRaw = rest.match(/\b(-?\d*\.?\d+)\b/)?.[1];
            const sx = sxRaw
                ? parseFloat(sxRaw)
                : uniRaw
                ? parseFloat(uniRaw)
                : 1;
            const sy = syRaw
                ? parseFloat(syRaw)
                : uniRaw
                ? parseFloat(uniRaw)
                : 1;
            const sz = szRaw
                ? parseFloat(szRaw)
                : uniRaw
                ? parseFloat(uniRaw)
                : 1;
            updateTransform(selected.id, {
                scale: {
                    x: selected.scale.x * sx,
                    y: selected.scale.y * sy,
                    z: selected.scale.z * sz,
                },
            });
            sys = `Scaled by (${sx}, ${sy}, ${sz})`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // change geometry kind
        const geomMatch = lc.match(
            /^set\s+(box|sphere|cylinder|cone|torus|plane)\b(.*)$/
        );
        if (geomMatch && selected) {
            const kind = geomMatch[1] as GeometryKind;
            const params = parseAddParams(kind, geomMatch[2] ?? "");
            updateGeometry(selected.id, kind, params);
            sys = `Changed geometry to ${kind}`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // bulk naming: "name the boxes Box1 Box2 Box3 Box4 Box5"
        const bulkNameMatch = lc.match(
            /^name\s+the\s+(boxes?|spheres?|cylinders?|cones?|tori?|planes?)\s+(.+)$/
        );
        if (bulkNameMatch) {
            console.log("Bulk naming fallback triggered for:", text);
            const objectType = bulkNameMatch[1];
            const namesString = bulkNameMatch[2];
            const names = namesString
                .split(/\s+/)
                .filter((name) => name.trim().length > 0);

            // Get the last created object IDs from the global variable
            const lastCreatedIds = (window as any).lastCreatedObjectIds || [];
            console.log(
                "Bulk naming - objectType:",
                objectType,
                "names:",
                names,
                "lastCreatedIds:",
                lastCreatedIds
            );

            if (lastCreatedIds.length === 0) {
                sys = "No recently created objects found to rename";
                push("system", sys);
                return;
            }

            if (names.length !== lastCreatedIds.length) {
                sys = `Mismatch: found ${lastCreatedIds.length} objects but ${names.length} names provided`;
                push("system", sys);
                return;
            }

            const updateNameStore = (useEditor as any).getState?.().updateName;
            if (!updateNameStore) {
                sys = "Update name function not available";
                push("system", sys);
                return;
            }

            let renamed = 0;
            for (
                let i = 0;
                i < Math.min(names.length, lastCreatedIds.length);
                i++
            ) {
                const name = names[i].trim();
                const id = lastCreatedIds[i];
                if (name && id) {
                    updateNameStore(id, name);
                    renamed++;
                }
            }

            sys = `Renamed ${renamed} ${objectType}`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }

        // boolean ops: union a b
        const boolMatch = lc.match(
            /^(union|subtract|intersect)\s+([^\s]+)\s+([^\s]+)$/
        );
        if (boolMatch) {
            const op = boolMatch[1] as "union" | "subtract" | "intersect";
            const a = findByNameOrId(boolMatch[2]);
            const b = findByNameOrId(boolMatch[3]);
            if (!a || !b) {
                sys = "Could not find both operands";
                push("system", sys);
                return;
            }
            booleanOp(op, a.id, b.id);
            try {
                const st = (useEditor as any).getState?.() || {};
                if (st.selectedId) ensurePinned(st.selectedId);
            } catch {}
            sys = `Boolean ${op} created from ${a.name} and ${b.name}`;
            push("system", sys);
            checkpoint(text, sys);
            return;
        }
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const t = input;
        setInput("");
        handleCommand(t);
        setAttachment(null);
    }

    return (
        <Panel data-chat-panel>
            <Header>
                <div>Chat</div>
                <div style={{ display: "flex", gap: 6 }}>
                    <Toggle onClick={() => setUsingLLM((v) => !v)}>
                        {usingLLM ? "LLM: On" : "LLM: Off"}
                    </Toggle>
                    <Toggle onClick={() => setShowHistory((v) => !v)}>
                        {showHistory ? "Hide" : "Show"} History
                    </Toggle>
                    <Toggle
                        onClick={() => {
                            // Hide via global store so layout unmounts the panel
                            try {
                                (useEditor as any).setState((s: any) => ({
                                    ...s,
                                    showChatPanel: false,
                                }));
                            } catch {}
                        }}
                    >
                        ✕
                    </Toggle>
                </div>
            </Header>
            <div
                style={{
                    padding: "6px 10px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <PinnedContainer>
                    <PinnedControls>
                        <div style={{ fontSize: 12, opacity: 0.85 }}>
                            Context: {pinnedIds.length} pinned
                        </div>
                        <SmallBtn
                            onClick={pinSelected}
                            disabled={!selectedId}
                            title="Pin selected to chat context"
                        >
                            Pin Selected
                        </SmallBtn>
                        <SmallBtn
                            onClick={clearPins}
                            title="Clear pinned context"
                        >
                            Clear
                        </SmallBtn>
                    </PinnedControls>
                    {pinnedIds.length > 0 && (
                        <PinnedList>
                            {pinnedIds.map((id) => {
                                const o = objects.find((x) => x.id === id);
                                if (!o) return null;
                                return (
                                    <PinnedItem key={id}>
                                        {o.name}
                                        <button
                                            onClick={() => unpin(id)}
                                            style={{
                                                background: "transparent",
                                                color: "#aaa",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 0,
                                                fontSize: "12px",
                                            }}
                                        >
                                            ×
                                        </button>
                                    </PinnedItem>
                                );
                            })}
                        </PinnedList>
                    )}
                </PinnedContainer>
            </div>
            {showHistory && (
                <History>
                    {checkpoints.length === 0 ? (
                        <div style={{ opacity: 0.6, fontSize: 12 }}>
                            No checkpoints yet
                        </div>
                    ) : (
                        checkpoints.slice(0, 10).map((cp) => (
                            <HistoryItem key={cp.id}>
                                <div
                                    style={{ flex: 1, minWidth: 0 }}
                                    title={cp.prompt ?? cp.label}
                                >
                                    <div
                                        style={{
                                            fontSize: 12,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {cp.label}
                                    </div>
                                    <div style={{ opacity: 0.6, fontSize: 11 }}>
                                        {new Date(
                                            cp.timestamp
                                        ).toLocaleTimeString()}
                                    </div>
                                </div>
                                <SmallBtn
                                    onClick={() => restoreCheckpoint(cp.id)}
                                >
                                    Restore
                                </SmallBtn>
                                <SmallBtn
                                    onClick={() => deleteCheckpoint(cp.id)}
                                >
                                    ✕
                                </SmallBtn>
                            </HistoryItem>
                        ))
                    )}
                </History>
            )}
            <Messages ref={scrollRef}>
                {messages.map((m, i) => (
                    <Message key={i} role={m.role}>
                        {m.text}
                        {isLoading && i === messages.length - 1 && usingLLM
                            ? " …"
                            : ""}
                    </Message>
                ))}
            </Messages>
            {attachment && (
                <div
                    style={{
                        padding: "6px 10px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            opacity: 0.85,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "70%",
                        }}
                    >
                        Attached: {attachment.name} (
                        {Math.max(1, Math.round(attachment.size / 1024))} KB)
                    </div>
                    <SmallBtn onClick={() => setAttachment(null)}>✕</SmallBtn>
                </div>
            )}
            <InputRow onSubmit={onSubmit}>
                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                />
                <AttachBtn
                    type="button"
                    aria-label="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                >
                    📎
                </AttachBtn>
                <TextInput
                    placeholder={
                        selected ? `Command for ${selected.name}…` : "Command…"
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            // handled by form submit
                        }
                    }}
                />
                <SendBtn type="submit">Send</SendBtn>
            </InputRow>
        </Panel>
    );
}

export default ChatPanel;
