import { memo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import {
    AccumulativeShadows,
    GizmoHelper,
    GizmoViewport,
    Grid,
    OrbitControls,
    PerspectiveCamera,
    TransformControls,
} from "@react-three/drei";
import { useEditor } from "../store/editor";
import * as THREE from "three";
import { deserializeGeometry } from "../utils/geometry";
import type { GeometryParamsMap, EditorState, SceneObject } from "../types";
import { useRegisterViewportActions } from "../provider/ViewportContext";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { TransformControls as TransformControlsImpl } from "three-stdlib";

function Selectable(props: { id: string; children: React.ReactNode }) {
    const selectedId = useEditor((s) => s.selectedId);
    const select = useEditor((s) => s.select);
    const isSelected = selectedId === props.id;
    return (
        <group
            onClick={(e) => {
                e.stopPropagation();
                select(props.id);
            }}
        >
            {props.children}
            {isSelected ? (
                <mesh>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshBasicMaterial color="#71d1ff" />
                </mesh>
            ) : null}
        </group>
    );
}

function RenderObject({
    o,
    isSelected,
    mode,
    snap,
    orbitRef,
    beginTransform,
    endTransform,
    updateTransform,
}: {
    o: SceneObject;
    isSelected: boolean;
    mode: "translate" | "rotate" | "scale";
    snap: {
        enableSnapping: boolean;
        translateSnap: number;
        rotateSnap: number;
        scaleSnap: number;
    };
    orbitRef: React.MutableRefObject<OrbitControlsImpl | null>;
    beginTransform: () => void;
    endTransform: () => void;
    updateTransform: (
        id: string,
        partial: Partial<Pick<SceneObject, "position" | "rotation" | "scale">>
    ) => void;
}) {
    const transformRef = useRef<TransformControlsImpl>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const setGizmoInteracting = useEditor((s) => s.setGizmoInteracting);
    const isTransforming = useEditor(
        (s: EditorState) => s.isTransforming ?? false
    );

    const position: ThreeElements["group"]["position"] = [
        o.position.x,
        o.position.y,
        o.position.z,
    ];
    const rotation: ThreeElements["group"]["rotation"] = [
        o.rotation.x,
        o.rotation.y,
        o.rotation.z,
    ];
    const scale: ThreeElements["group"]["scale"] = [
        o.scale.x,
        o.scale.y,
        o.scale.z,
    ];
    const material = (
        <meshStandardMaterial
            color={o.material.color}
            metalness={o.material.metalness}
            roughness={o.material.roughness}
            opacity={o.material.opacity}
            transparent={o.material.transparent}
        />
    );

    const geom = (() => {
        switch (o.geometry) {
            case "box": {
                const p = o.geometryParams as
                    | GeometryParamsMap["box"]
                    | undefined;
                return (
                    <boxGeometry
                        args={[p?.width ?? 1, p?.height ?? 1, p?.depth ?? 1]}
                    />
                );
            }
            case "sphere": {
                const p = o.geometryParams as
                    | GeometryParamsMap["sphere"]
                    | undefined;
                return (
                    <sphereGeometry
                        args={[
                            p?.radius ?? 0.5,
                            p?.widthSegments ?? 32,
                            p?.heightSegments ?? 16,
                        ]}
                    />
                );
            }
            case "cylinder": {
                const p = o.geometryParams as
                    | GeometryParamsMap["cylinder"]
                    | undefined;
                return (
                    <cylinderGeometry
                        args={[
                            p?.radiusTop ?? 0.5,
                            p?.radiusBottom ?? 0.5,
                            p?.height ?? 1,
                            p?.radialSegments ?? 32,
                        ]}
                    />
                );
            }
            case "cone": {
                const p = o.geometryParams as
                    | GeometryParamsMap["cone"]
                    | undefined;
                return (
                    <coneGeometry
                        args={[
                            p?.radius ?? 0.5,
                            p?.height ?? 1,
                            p?.radialSegments ?? 32,
                        ]}
                    />
                );
            }
            case "torus": {
                const p = o.geometryParams as
                    | GeometryParamsMap["torus"]
                    | undefined;
                return (
                    <torusGeometry
                        args={[
                            p?.radius ?? 0.5,
                            p?.tube ?? 0.2,
                            p?.radialSegments ?? 16,
                            p?.tubularSegments ?? 64,
                        ]}
                    />
                );
            }
            case "plane": {
                const p = o.geometryParams as
                    | GeometryParamsMap["plane"]
                    | undefined;
                return (
                    <planeGeometry
                        args={[
                            p?.width ?? 1,
                            p?.height ?? 1,
                            p?.widthSegments ?? 1,
                            p?.heightSegments ?? 1,
                        ]}
                    />
                );
            }
            case "custom": {
                const data = o.geometryParams as
                    | GeometryParamsMap["custom"]
                    | undefined;
                if (!data) return <boxGeometry args={[1, 1, 1]} />;
                const g = deserializeGeometry(data);
                return <primitive attach="geometry" object={g} />;
            }
            default:
                return <boxGeometry args={[1, 1, 1]} />;
        }
    })();

    const meshProps =
        !isSelected || !isTransforming ? { position, rotation, scale } : {};

    const mesh = (
        <mesh
            ref={meshRef}
            visible={o.visible}
            {...(meshProps as Partial<ThreeElements["mesh"]>)}
            castShadow
            receiveShadow
            raycast={isSelected ? () => {} : undefined}
        >
            {geom}
            {material}
        </mesh>
    );

    if (isSelected) {
        return (
            <TransformControls
                ref={transformRef as React.Ref<TransformControlsImpl>}
                mode={mode}
                showX
                showY
                showZ
                translationSnap={
                    snap.enableSnapping ? snap.translateSnap : undefined
                }
                rotationSnap={snap.enableSnapping ? snap.rotateSnap : undefined}
                scaleSnap={snap.enableSnapping ? snap.scaleSnap : undefined}
                onPointerDown={() => {
                    if (orbitRef.current) orbitRef.current.enabled = false;
                    setGizmoInteracting(true);
                    beginTransform();
                }}
                onPointerUp={() => {
                    const obj = (
                        transformRef.current as unknown as {
                            object?: THREE.Object3D;
                        }
                    )?.object;
                    if (obj) {
                        updateTransform(o.id, {
                            position: {
                                x: obj.position.x,
                                y: obj.position.y,
                                z: obj.position.z,
                            },
                            rotation: {
                                x: obj.rotation.x,
                                y: obj.rotation.y,
                                z: obj.rotation.z,
                            },
                            scale: {
                                x: obj.scale.x,
                                y: obj.scale.y,
                                z: obj.scale.z,
                            },
                        });
                    }
                    endTransform();
                    setGizmoInteracting(false);
                    if (orbitRef.current) orbitRef.current.enabled = true;
                }}
            >
                {mesh}
            </TransformControls>
        );
    }

    return <Selectable id={o.id}>{mesh}</Selectable>;
}

function SceneObjects({
    orbitRef,
}: {
    orbitRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
    const objects = useEditor((s) => s.objects);
    const selectedId = useEditor((s) => s.selectedId);
    const mode = useEditor((s) => s.mode);
    const snap = useEditor((s) => s.snap);
    const updateTransform = useEditor((s) => s.updateTransform);
    const beginTransform = useEditor((s) => s.beginTransform);
    const endTransform = useEditor((s) => s.endTransform);

    return (
        <group>
            {objects.map((o) => (
                <RenderObject
                    key={o.id}
                    o={o}
                    isSelected={selectedId === o.id}
                    mode={mode}
                    snap={snap}
                    orbitRef={orbitRef}
                    beginTransform={beginTransform}
                    endTransform={endTransform}
                    updateTransform={updateTransform}
                />
            ))}
        </group>
    );
}

function Lights() {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[5, 5, 5]}
                intensity={0.8}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />
        </>
    );
}

export function Viewport() {
    const select = useEditor((s) => s.select);
    const isTransforming = useEditor(
        (s: EditorState) => s.isTransforming ?? false
    );
    const isGizmoInteracting = useEditor(
        (s: EditorState & { isGizmoInteracting?: boolean }) =>
            s.isGizmoInteracting ?? false
    );
    const orbitRef = useRef<OrbitControlsImpl | null>(null);
    const addObject = useEditor((s) => s.addObject);
    const register = useRegisterViewportActions();

    useEffect(() => {
        register({
            resetCamera: () => {
                if (!orbitRef.current) return;
                (orbitRef.current as any).target.set(0, 0, 0);
                const camera = (orbitRef.current as any).object as THREE.Camera;
                if ((camera as any).position)
                    (camera as any).position.set(4, 3, 6);
                (orbitRef.current as any).update?.();
            },
            createCube: () => addObject("box"),
            createSphere: () => addObject("sphere"),
            startHandDrag: () => {
                let selectedId = useEditor.getState().selectedId;
                if (!selectedId) {
                    useEditor.getState().addObject("box");
                    selectedId = useEditor.getState().selectedId;
                }
                if (selectedId) useEditor.getState().beginTransform();
            },
            updateHandDragNormalized: (u: number, v: number) => {
                const selectedId = useEditor.getState().selectedId;
                if (!selectedId) return;
                const objects = useEditor.getState().objects;
                const obj = objects.find((o) => o.id === selectedId);
                if (!obj) return;
                const range = 5;
                const x = (u - 0.5) * 2 * range;
                const z = (v - 0.5) * 2 * range;
                useEditor.getState().updateTransform(selectedId, {
                    position: { x, y: obj.position.y, z },
                });
            },
            endHandDrag: () => {
                const selectedId = useEditor.getState().selectedId;
                if (selectedId) useEditor.getState().endTransform();
            },
            orbitRotate: (dxN: number, dyN: number) => {
                if (!orbitRef.current) return;
                const ctrl = orbitRef.current as any;
                const rotSpeed = 1.2;
                ctrl.rotateLeft(-dxN * rotSpeed);
                ctrl.rotateUp(-dyN * rotSpeed);
                ctrl.update?.();
            },
            orbitPan: (dxN: number, dyN: number) => {
                if (!orbitRef.current) return;
                const ctrl = orbitRef.current as any;
                const panSpeed = 2;
                ctrl.pan(dxN * panSpeed, -dyN * panSpeed);
                ctrl.update?.();
            },
            orbitDolly: (delta: number) => {
                if (!orbitRef.current) return;
                const ctrl = orbitRef.current as any;
                const zoomFactor = Math.exp(delta * 0.5);
                ctrl.dollyIn(zoomFactor);
                ctrl.update?.();
            },
        });
    }, [register, addObject]);

    return (
        <Canvas
            shadows
            dpr={[1, 2]}
            onPointerMissed={() => {
                if (!isTransforming && !isGizmoInteracting) select(null);
            }}
        >
            <color attach="background" args={[0.08, 0.08, 0.1]} />
            <PerspectiveCamera makeDefault position={[4, 3, 6]} fov={50} />
            <OrbitControls
                ref={orbitRef as React.Ref<OrbitControlsImpl>}
                makeDefault
                enableDamping
                dampingFactor={0.08}
            />
            <Lights />
            <Grid
                infiniteGrid
                fadeDistance={40}
                cellSize={0.5}
                sectionSize={2}
                cellThickness={0.3}
                sectionThickness={1}
            />
            <AccumulativeShadows
                frames={60}
                temporal
                alphaTest={0.9}
                scale={20}
                position={[0, -0.001, 0]}
            >
                <ambientLight intensity={0.5} />
            </AccumulativeShadows>
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport
                    axisColors={["#ff6b6b", "#51cf66", "#4dabf7"]}
                    labelColor="#dee2e6"
                />
            </GizmoHelper>
            <SceneObjects orbitRef={orbitRef} />
        </Canvas>
    );
}

export default memo(Viewport);
