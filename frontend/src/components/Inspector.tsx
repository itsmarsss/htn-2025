import React, { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { useEditor } from "../store/editor";
import { DuplicateIcon, DeleteIcon } from "./ShapeIcons";

const Header = styled.div<{ isDragging?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    cursor: ${(props) => (props.isDragging ? "grabbing" : "grab")};
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
    visible: boolean;
    top: number;
    left: number;
    height: number;
    isDragging?: boolean;
}>`
    position: absolute;
    top: ${(props) => props.top}px;
    left: ${(props) => props.left}px;
    width: 280px;
    height: ${(props) => props.height}px;
    background: rgba(18, 20, 26, 0.9);
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px;
    overflow: auto;
    opacity: ${(props) => (props.visible ? 1 : 0)};
    visibility: ${(props) => (props.visible ? "visible" : "hidden")};
    transform: ${(props) =>
        props.visible ? "translateX(0)" : "translateX(20px)"};
    transition: ${(props) => (props.isDragging ? "none" : "all 0.2s ease")};
    cursor: ${(props) => (props.isDragging ? "grabbing" : "default")};
    user-select: none;
    z-index: 1000;
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
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
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
    const objects = useEditor((s) => s.objects);
    const updateTransform = useEditor((s) => s.updateTransform);
    const updateMaterial = useEditor((s) => s.updateMaterial);
    const duplicateSelected = useEditor((s) => s.duplicateSelected);
    const deleteSelected = useEditor((s) => s.deleteSelected);
    
    // Function to update object name
    const updateName = useEditor((s) => s.updateName);

    const obj = objects.find((o) => o.id === selectedId);
    const isVisible = !!obj; // Show inspector when an object is selected

    // State for dragging and resizing
    const [position, setPosition] = useState({
        top: 56,
        left: window.innerWidth - 308 - 280,
        height: 400,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ y: 0, height: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    // Drag handlers
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        if (
            e.target === e.currentTarget ||
            (e.target as HTMLElement).closest("[data-drag-handle]")
        ) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX,
                y: e.clientY,
            });
        }
    }, []);

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

                setPosition((prev) => ({
                    top: Math.max(
                        56,
                        Math.min(
                            window.innerHeight - prev.height - 12,
                            prev.top + deltaY
                        )
                    ),
                    left: Math.max(
                        12,
                        Math.min(
                            window.innerWidth - 280 - 12,
                            prev.left + deltaX
                        )
                    ),
                    height: prev.height,
                }));

                setDragStart({ x: e.clientX, y: e.clientY });
            }

            if (isResizing) {
                const deltaY = e.clientY - resizeStart.y;
                const newHeight = Math.max(
                    200,
                    Math.min(
                        window.innerHeight - position.top - 12,
                        resizeStart.height + deltaY // Fixed: was -deltaY, now +deltaY
                    )
                );

                setPosition((prev) => ({
                    ...prev,
                    height: newHeight,
                }));
            }
        },
        [isDragging, isResizing, dragStart, resizeStart, position.top]
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

    // Don't render anything if no object is selected
    if (!obj) {
        return (
            <InspectorContainer
                visible={false}
                top={position.top}
                left={position.left}
                height={position.height}
            />
        );
    }

    return (
        <InspectorContainer
            ref={containerRef}
            visible={isVisible}
            top={position.top}
            left={position.left}
            height={position.height}
            isDragging={isDragging}
        >
            <Header
                data-drag-handle
                isDragging={isDragging}
                onMouseDown={handleDragStart}
            >
                <Title>Inspector</Title>
                <CloseButton
                    onClick={() => {
                        // Deselect the current object to hide the inspector
                        useEditor.getState().select(null);
                    }}
                >
                    ✕
                </CloseButton>
            </Header>

            <Label>Position</Label>
            <Row>
                <InputGroup>
                    <InputLabel axis="x">X</InputLabel>
                    <Input
                        type="number"
                        step="0.1"
                        value={obj.position.x}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                position: { x: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="y">Y</InputLabel>
                    <Input
                        type="number"
                        step="0.1"
                        value={obj.position.y}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                position: { y: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="z">Z</InputLabel>
                    <Input
                        type="number"
                        step="0.1"
                        value={obj.position.z}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                position: { z: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
            </Row>
            <Label>Rotation</Label>
            <Row>
                <InputGroup>
                    <InputLabel axis="x">X</InputLabel>
                    <Input
                        type="number"
                        step="0.05"
                        value={obj.rotation.x}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                rotation: { x: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="y">Y</InputLabel>
                    <Input
                        type="number"
                        step="0.05"
                        value={obj.rotation.y}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                rotation: { y: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="z">Z</InputLabel>
                    <Input
                        type="number"
                        step="0.05"
                        value={obj.rotation.z}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                rotation: { z: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
            </Row>
            <Label>Scale</Label>
            <Row>
                <InputGroup>
                    <InputLabel axis="x">X</InputLabel>
                    <Input
                        type="number"
                        step="0.1"
                        value={obj.scale.x}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                scale: { x: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="y">Y</InputLabel>
                    <Input
                        type="number"
                        step="0.1"
                        value={obj.scale.y}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                scale: { y: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
                <InputGroup>
                    <InputLabel axis="z">Z</InputLabel>
                    <Input
                        type="number"
                        step="0.1"
                        value={obj.scale.z}
                        onChange={(e) =>
                            updateTransform(obj.id, {
                                scale: { z: parseFloat(e.target.value) },
                            })
                        }
                    />
                </InputGroup>
            </Row>

            <Label>Material</Label>
            <Row>
                <Input
                    type="color"
                    value={obj.material.color}
                    onChange={(e) =>
                        updateMaterial(obj.id, { color: e.target.value })
                    }
                />
                <Input
                    type="number"
                    step="0.05"
                    value={obj.material.metalness}
                    onChange={(e) =>
                        updateMaterial(obj.id, {
                            metalness: parseFloat(e.target.value),
                        })
                    }
                />
                <Input
                    type="number"
                    step="0.05"
                    value={obj.material.roughness}
                    onChange={(e) =>
                        updateMaterial(obj.id, {
                            roughness: parseFloat(e.target.value),
                        })
                    }
                />
            </Row>

            <ActionsRow>
                <ActionButton
                    onClick={duplicateSelected}
                    title="Duplicate Object"
                >
                    <DuplicateIcon size={14} />
                    Duplicate
                </ActionButton>
                <ActionButton onClick={deleteSelected} title="Delete Object">
                    <DeleteIcon size={14} />
                    Delete
                </ActionButton>
            </ActionsRow>
            <ResizeHandle onMouseDown={handleResizeStart} />
        </InspectorContainer>
    );
}

export default Inspector;
