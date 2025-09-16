import React, { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { useEditor } from "../store/editor";
import { DuplicateIcon, DeleteIcon } from "./ShapeIcons";
// import type { SceneObject, SceneLight } from "../types";

const Header = styled.div<{ $isDragging?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    cursor: ${(props) => (props.$isDragging ? "grabbing" : "grab")};
    user-select: none;
`;

const Title = styled.div`
    font-weight: 600;
    opacity: 0.9;
`;

const CloseButton = styled.button`
    background: #12141a;
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
`;

const InspectorContainer = styled.div<{
    $visible: boolean;
    $top: number;
    $left: number;
    $height: number;
    $isDragging?: boolean;
}>`
    position: absolute;
    top: ${(props) => props.$top}px;
    left: ${(props) => props.$left}px;
    width: 280px;
    height: ${(props) => props.$height}px;
    background: rgba(18, 20, 26, 0.9);
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px;
    overflow: auto;
    opacity: ${(props) => (props.$visible ? 1 : 0)};
    visibility: ${(props) => (props.$visible ? "visible" : "hidden")};
    transform: ${(props) =>
        props.$visible ? "translateX(0)" : "translateX(20px)"};
    transition: ${(props) => (props.$isDragging ? "none" : "all 0.2s ease")};
    cursor: ${(props) => (props.$isDragging ? "grabbing" : "default")};
    user-select: none;
    z-index: 1000;

    /* Hide scrollbar for all browsers */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */

    &::-webkit-scrollbar {
        display: none; /* WebKit */
    }
`;

const Row = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
    margin-bottom: 10px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const InputLabel = styled.div<{ axis: "x" | "y" | "z" }>`
    font-size: 10px;
    opacity: 0.8;
    text-align: center;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${(props) => {
        switch (props.axis) {
            case "x":
                return "#ff2222"; // Bright Red
            case "y":
                return "#22ff22"; // Bright Green
            case "z":
                return "#2222ff"; // Bright Blue
            default:
                return "#e6e9ef";
        }
    }};
`;

const Label = styled.div`
    opacity: 0.7;
    margin: 8px 0 6px;
`;

const Input = styled.input`
    background: #0f1116;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e9ef;
    border-radius: 8px;
    padding: 6px 8px;
    width: 100%;
`;

const NameInput = styled.input`
    background: #0f1116;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e9ef;
    border-radius: 8px;
    padding: 8px 12px;
    width: 100%;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 16px;

    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.2);
        background: #0f1116;
    }
`;

const ObjectSelector = styled.select`
    background: #0f1116;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e9ef;
    border-radius: 8px;
    padding: 8px 12px;
    width: 100%;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 16px;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.2);
        background: #0f1116;
    }

    option {
        background: #0f1116;
        color: #e6e9ef;
        padding: 8px;
    }
`;

const SnapRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
`;

const SnapInput = styled.input`
    background: #0f1116;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e9ef;
    border-radius: 6px;
    padding: 4px 6px;
    width: 100%;
    font-size: 12px;
`;

const SnapLabel = styled.div`
    font-size: 10px;
    opacity: 0.6;
    text-align: center;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
`;

const SnapCheckbox = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 12px;
    opacity: 0.8;
    margin-bottom: 12px;

    input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #9aa7ff;
    }
`;

const ActionButton = styled.button`
    background: rgba(18, 20, 26, 0.9);
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;

    &:hover {
        background: rgba(18, 20, 26, 1);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
`;

const ActionsRow = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const ResizeHandle = styled.div`
    position: sticky;
    bottom: -10px;
    left: 0;
    right: 0;
    margin-top: 10px;
    margin-bottom: -10px;
    height: 8px;
    cursor: ns-resize;
    background: transparent;
    z-index: 1001;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    &::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 2px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 1px;
    }
`;

export function Inspector() {
    const selectedId = useEditor((s) => s.selectedId);
    const showInspector = useEditor((s) => s.showInspector);
    const objects = useEditor((s) => s.objects);
    const lights = useEditor((s) => s.lights);
    const updateTransform = useEditor((s) => s.updateTransform);
    const updateLightTransform = useEditor((s) => s.updateLightTransform);
    const updateMaterial = useEditor((s) => s.updateMaterial);
    const updateLightProps = useEditor((s) => s.updateLightProps);
    const duplicateSelected = useEditor((s) => s.duplicateSelected);
    const deleteSelected = useEditor((s) => s.deleteSelected);
    const deleteLight = useEditor((s) => s.deleteLight);
    const select = useEditor((s) => s.select);
    const snap = useEditor((s) => s.snap);
    const toggleSnap = useEditor((s) => s.toggleSnap);
    const setSnap = useEditor((s) => s.setSnap);
    const setShowInspector = useEditor((s) => s.setShowInspector);

    // Function to update object name
    const updateName = useEditor((s) => s.updateName);

    const obj = objects.find((o) => o.id === selectedId);
    const light = lights?.find((l) => l.id === selectedId);
    const isVisible = showInspector; // Show inspector based on button toggle

    // State for dragging and resizing
    const [position, setPosition] = useState({
        top: 56,
        left: window.innerWidth - 308 - 280,
        height: 400,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, top: 0, left: 0 });
    const [resizeStart, setResizeStart] = useState({ y: 0, height: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    // Drag handlers
    const handleDragStart = useCallback(
        (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            // Ignore drags starting from interactive controls
            if (
                target.closest(
                    "input,select,textarea,button,[contenteditable='true'],[data-no-drag]"
                )
            )
                return;
            if (
                target === e.currentTarget ||
                target.closest("[data-drag-handle],[data-drag-area]")
            ) {
                setIsDragging(true);
                setDragStart({
                    x: e.clientX,
                    y: e.clientY,
                    top: position.top,
                    left: position.left,
                });
            }
        },
        [position.top, position.left]
    );

    const handleResizeStart = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setIsResizing(true);
            setResizeStart({
                y: e.clientY,
                height: position.height,
            });
        },
        [position.height]
    );

    // Mouse move handler
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                const deltaX = e.clientX - dragStart.x;
                const deltaY = e.clientY - dragStart.y;

                setPosition({
                    top: Math.max(
                        56,
                        Math.min(
                            window.innerHeight - position.height - 12,
                            dragStart.top + deltaY
                        )
                    ),
                    left: Math.max(
                        12,
                        Math.min(
                            window.innerWidth - 280 - 12,
                            dragStart.left + deltaX
                        )
                    ),
                    height: position.height,
                });
            }

            if (isResizing) {
                const deltaY = e.clientY - resizeStart.y;
                const newHeight = Math.max(
                    200,
                    Math.min(
                        window.innerHeight - position.top - 12,
                        resizeStart.height + deltaY
                    )
                );

                setPosition((prev) => ({
                    ...prev,
                    height: newHeight,
                }));
            }
        },
        [
            isDragging,
            isResizing,
            dragStart,
            resizeStart,
            position.top,
            position.height,
        ]
    );

    // Mouse up handler
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    // Add event listeners
    React.useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    // Don't render anything if inspector is not visible
    if (!isVisible) {
        return (
            <InspectorContainer
                $visible={false}
                $top={position.top}
                $left={position.left}
                $height={position.height}
            />
        );
    }

    const selectedItem = obj || light;
    const isLight = !!light;

    return (
        <InspectorContainer
            ref={containerRef}
            $visible={isVisible}
            $top={position.top}
            $left={position.left}
            $height={position.height}
            $isDragging={isDragging}
            data-drag-area
            onMouseDown={handleDragStart}
        >
            <Header
                data-drag-handle
                $isDragging={isDragging}
                onMouseDown={handleDragStart}
            >
                <Title>Inspector</Title>
                <CloseButton
                    onClick={() => {
                        setShowInspector(false);
                    }}
                >
                    ✕
                </CloseButton>
            </Header>

            <Label>{isLight ? "Light" : "Object"}</Label>
            <ObjectSelector
                value={selectedId || ""}
                onChange={(e) => select(e.target.value || null)}
            >
                <option value="">Select an item...</option>
                {objects.map((object) => (
                    <option key={object.id} value={object.id}>
                        {object.name} ({object.geometry})
                    </option>
                ))}
                {lights.map((light) => (
                    <option key={light.id} value={light.id}>
                        {light.name} ({light.type})
                    </option>
                ))}
            </ObjectSelector>

            <Label>Name</Label>
            <NameInput
                type="text"
                value={selectedItem?.name || ""}
                onChange={(e) => {
                    if (isLight) {
                        // For lights, we'll need to add updateLightName function
                        // For now, just update the name in the store directly
                        useEditor.setState((state) => ({
                            ...state,
                            lights: state.lights.map((l) =>
                                l.id === selectedId
                                    ? { ...l, name: e.target.value }
                                    : l
                            ),
                        }));
                    } else {
                        updateName(selectedItem!.id, e.target.value);
                    }
                }}
                placeholder={isLight ? "Light Name" : "Object Name"}
            />

            <Label>Position</Label>
            <Row>
                <InputGroup>
                    <InputLabel axis="x">X</InputLabel>
                    <Input
                        type="number"
                        step={snap.enableSnapping ? snap.translateSnap : 0.1}
                        value={selectedItem?.position.x || 0}
                        onChange={(e) => {
                            const updateFn = isLight
                                ? updateLightTransform
                                : updateTransform;
                            updateFn(selectedItem!.id, {
                                position: { x: parseFloat(e.target.value) },
                            });
                        }}
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="y">Y</InputLabel>
                    <Input
                        type="number"
                        step={snap.enableSnapping ? snap.translateSnap : 0.1}
                        value={selectedItem?.position.y || 0}
                        onChange={(e) => {
                            const updateFn = isLight
                                ? updateLightTransform
                                : updateTransform;
                            updateFn(selectedItem!.id, {
                                position: { y: parseFloat(e.target.value) },
                            });
                        }}
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="z">Z</InputLabel>
                    <Input
                        type="number"
                        step={snap.enableSnapping ? snap.translateSnap : 0.1}
                        value={selectedItem?.position.z || 0}
                        onChange={(e) => {
                            const updateFn = isLight
                                ? updateLightTransform
                                : updateTransform;
                            updateFn(selectedItem!.id, {
                                position: { z: parseFloat(e.target.value) },
                            });
                        }}
                    />
                </InputGroup>
            </Row>
            <Label>Rotation</Label>
            <Row>
                <InputGroup>
                    <InputLabel axis="x">X</InputLabel>
                    <Input
                        type="number"
                        step={snap.enableSnapping ? snap.rotateSnap : 0.05}
                        value={selectedItem?.rotation.x || 0}
                        onChange={(e) => {
                            const updateFn = isLight
                                ? updateLightTransform
                                : updateTransform;
                            updateFn(selectedItem!.id, {
                                rotation: { x: parseFloat(e.target.value) },
                            });
                        }}
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="y">Y</InputLabel>
                    <Input
                        type="number"
                        step={snap.enableSnapping ? snap.rotateSnap : 0.05}
                        value={selectedItem?.rotation.y || 0}
                        onChange={(e) => {
                            const updateFn = isLight
                                ? updateLightTransform
                                : updateTransform;
                            updateFn(selectedItem!.id, {
                                rotation: { y: parseFloat(e.target.value) },
                            });
                        }}
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="z">Z</InputLabel>
                    <Input
                        type="number"
                        step={snap.enableSnapping ? snap.rotateSnap : 0.05}
                        value={selectedItem?.rotation.z || 0}
                        onChange={(e) => {
                            const updateFn = isLight
                                ? updateLightTransform
                                : updateTransform;
                            updateFn(selectedItem!.id, {
                                rotation: { z: parseFloat(e.target.value) },
                            });
                        }}
                    />
                </InputGroup>
            </Row>
            {!isLight && (
                <>
                    <Label>Scale</Label>
                    <Row>
                        <InputGroup>
                            <InputLabel axis="x">X</InputLabel>
                            <Input
                                type="number"
                                step={
                                    snap.enableSnapping ? snap.scaleSnap : 0.1
                                }
                                value={obj?.scale.x || 0}
                                onChange={(e) =>
                                    updateTransform(obj!.id, {
                                        scale: {
                                            x: parseFloat(e.target.value),
                                        },
                                    })
                                }
                            />
                        </InputGroup>
                        <InputGroup>
                            <InputLabel axis="y">Y</InputLabel>
                            <Input
                                type="number"
                                step={
                                    snap.enableSnapping ? snap.scaleSnap : 0.1
                                }
                                value={obj?.scale.y || 0}
                                onChange={(e) =>
                                    updateTransform(obj!.id, {
                                        scale: {
                                            y: parseFloat(e.target.value),
                                        },
                                    })
                                }
                            />
                        </InputGroup>
                        <InputGroup>
                            <InputLabel axis="z">Z</InputLabel>
                            <Input
                                type="number"
                                step={
                                    snap.enableSnapping ? snap.scaleSnap : 0.1
                                }
                                value={obj?.scale.z || 0}
                                onChange={(e) =>
                                    updateTransform(obj!.id, {
                                        scale: {
                                            z: parseFloat(e.target.value),
                                        },
                                    })
                                }
                            />
                        </InputGroup>
                    </Row>

                    <Label>Material</Label>
                    <Row>
                        <Input
                            type="color"
                            value={obj?.material.color || "#ffffff"}
                            onChange={(e) =>
                                updateMaterial(obj!.id, {
                                    color: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            step="0.05"
                            value={obj?.material.metalness || 0}
                            onChange={(e) =>
                                updateMaterial(obj!.id, {
                                    metalness: parseFloat(e.target.value),
                                })
                            }
                        />
                        <Input
                            type="number"
                            step="0.05"
                            value={obj?.material.roughness || 0}
                            onChange={(e) =>
                                updateMaterial(obj!.id, {
                                    roughness: parseFloat(e.target.value),
                                })
                            }
                        />
                    </Row>
                </>
            )}

            {isLight && (
                <>
                    <Label>Light Properties</Label>
                    <Row>
                        <Input
                            type="color"
                            value={light?.props.color || "#ffffff"}
                            onChange={(e) =>
                                updateLightProps(light!.id, {
                                    color: e.target.value,
                                })
                            }
                        />
                        <Input
                            type="number"
                            step="0.1"
                            value={light?.props.intensity || 1}
                            onChange={(e) =>
                                updateLightProps(light!.id, {
                                    intensity: parseFloat(e.target.value),
                                })
                            }
                        />
                    </Row>
                    {light?.type === "point" && (
                        <>
                            <Label>Distance</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={light?.props.distance || 0}
                                onChange={(e) =>
                                    updateLightProps(light!.id, {
                                        distance: parseFloat(e.target.value),
                                    })
                                }
                            />
                        </>
                    )}
                    {light?.type === "spot" && (
                        <>
                            <Label>Angle</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={light?.props.angle || Math.PI / 3}
                                onChange={(e) =>
                                    updateLightProps(light!.id, {
                                        angle: parseFloat(e.target.value),
                                    })
                                }
                            />
                        </>
                    )}
                </>
            )}

            <Label>Snap Settings</Label>
            <SnapCheckbox>
                <input
                    type="checkbox"
                    checked={snap.enableSnapping}
                    onChange={(e) => toggleSnap(e.target.checked)}
                />
                Enable Snapping
            </SnapCheckbox>
            <SnapRow>
                <div>
                    <SnapLabel>Move</SnapLabel>
                    <SnapInput
                        type="number"
                        step="0.1"
                        value={snap.translateSnap}
                        onChange={(e) =>
                            setSnap({
                                translateSnap: parseFloat(e.target.value),
                            })
                        }
                    />
                </div>
                <div>
                    <SnapLabel>Rotate</SnapLabel>
                    <SnapInput
                        type="number"
                        step="0.01"
                        value={snap.rotateSnap}
                        onChange={(e) =>
                            setSnap({ rotateSnap: parseFloat(e.target.value) })
                        }
                    />
                </div>
                <div>
                    <SnapLabel>Scale</SnapLabel>
                    <SnapInput
                        type="number"
                        step="0.01"
                        value={snap.scaleSnap}
                        onChange={(e) =>
                            setSnap({ scaleSnap: parseFloat(e.target.value) })
                        }
                    />
                </div>
            </SnapRow>

            <ActionsRow>
                {!isLight && (
                    <ActionButton
                        onClick={duplicateSelected}
                        title="Duplicate Object"
                    >
                        <DuplicateIcon size={14} />
                        Duplicate
                    </ActionButton>
                )}
                <ActionButton
                    onClick={
                        isLight ? () => deleteLight(light!.id) : deleteSelected
                    }
                    title={isLight ? "Delete Light" : "Delete Object"}
                >
                    <DeleteIcon size={14} />
                    Delete
                </ActionButton>
            </ActionsRow>
            <ResizeHandle onMouseDown={handleResizeStart} />
        </InspectorContainer>
    );
}

export default Inspector;
