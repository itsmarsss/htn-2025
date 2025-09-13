import * as THREE from "three";
import { useEffect, useRef } from "react";
import React from "react";
import { useThreeD } from "../provider/ThreeDContext";
import type { InteractionState } from "../objects/InteractionState";

interface ThreeRendererProps {
    interactionStateRef: React.MutableRefObject<InteractionState>;
}

function ThreeRenderer({ interactionStateRef }: ThreeRendererProps) {
    const mountRef = useRef<HTMLDivElement | null>(null);

    const {
        setupScene,
        renderScene,
        mainGroupRef,
        cameraRef,
        cornerMarkersRef,
        zoomRef,
        rendererRef,
        resetCameraRef,
        objectsRef,
    } = useThreeD();

    const pointerRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));

    const targetCameraPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
    const targetRotationRef = useRef({ x: 0, y: 0 });
    const targetZoomRef = useRef(1);

    useEffect(() => {
        if (!mountRef.current) return;
        setupScene(mountRef);

        if (cameraRef.current) {
            targetCameraPositionRef.current.copy(cameraRef.current.position);
        }

        const animate = () => {
            requestAnimationFrame(animate);
            renderScene();

            if (mainGroupRef.current) {
                const s = 0.1;
                mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(
                    mainGroupRef.current.rotation.x,
                    targetRotationRef.current.x,
                    s
                );
                mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(
                    mainGroupRef.current.rotation.y,
                    targetRotationRef.current.y,
                    s
                );
            }

            if (cameraRef.current) {
                if (resetCameraRef.current) {
                    targetCameraPositionRef.current.copy(
                        cameraRef.current.position
                    );
                    targetZoomRef.current = 1;
                    targetRotationRef.current = { x: 0, y: 0 } as any;
                    resetCameraRef.current = false;
                    return;
                }
                const lerpFactor = 0.1;
                const curr = cameraRef.current.position;
                const delta = targetCameraPositionRef.current.clone().sub(curr);
                if (delta.length() > 0.01) {
                    cameraRef.current.position.add(
                        delta.multiplyScalar(lerpFactor)
                    );
                } else {
                    cameraRef.current.position.copy(
                        targetCameraPositionRef.current
                    );
                }
                cameraRef.current.updateProjectionMatrix();
            }

            const right = interactionStateRef.current.Right;
            const left = interactionStateRef.current.Left;
            const handCursor = right?.cursor || left?.cursor;
            if (handCursor && mountRef.current) {
                const rect = mountRef.current.getBoundingClientRect();
                pointerRef.current.x =
                    (handCursor.coords.x / rect.width) * 2 - 1;
                pointerRef.current.y =
                    -(handCursor.coords.y / rect.height) * 2 + 1;
            }

            if (mainGroupRef.current) {
                const zS = 0.05;
                const curr = mainGroupRef.current.scale.x;
                const next = THREE.MathUtils.lerp(
                    curr,
                    targetZoomRef.current,
                    zS
                );
                mainGroupRef.current.scale.set(next, next, next);
            }

            const TOL = 0.025 * (zoomRef.current || 1);
            let closestMarker: THREE.Mesh | null = null;
            let minDist = Infinity;
            cornerMarkersRef.current.forEach((marker) => {
                const wp = new THREE.Vector3();
                marker.getWorldPosition(wp);
                wp.project(cameraRef.current!);
                const p2 = new THREE.Vector2(wp.x, wp.y);
                const d = pointerRef.current.distanceTo(p2);
                if (d < minDist) {
                    minDist = d;
                    closestMarker = marker;
                }
            });
            cornerMarkersRef.current.forEach((marker) => {
                const material = marker.material as THREE.MeshBasicMaterial;
                material.color.set(
                    marker === closestMarker && minDist < TOL
                        ? 0xffff00
                        : 0x0000ff
                );
            });
        };
        animate();

        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            rendererRef.current!.setSize(width, height);
            cameraRef.current!.aspect = width / height;
            cameraRef.current!.updateProjectionMatrix();
        });
        ro.observe(mountRef.current);
        return () => {
            ro.disconnect();
            rendererRef.current!.dispose();
            if (mountRef.current) {
                mountRef.current.removeChild(rendererRef.current!.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

export default React.memo(ThreeRenderer);
