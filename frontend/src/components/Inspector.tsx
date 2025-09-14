import styled from "styled-components";
import { useEditor } from "../store/editor";
import { DuplicateIcon, DeleteIcon } from "./ShapeIcons";

const Panel = styled.div`
    position: absolute;
    top: 56px;
    bottom: 12px;
    right: 308px;
    width: 280px;
    background: rgba(18, 20, 26, 0.9);
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px;
    overflow: auto;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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

export function Inspector() {
    const selectedId = useEditor((s) => s.selectedId);
    const objects = useEditor((s) => s.objects);
    const updateTransform = useEditor((s) => s.updateTransform);
    const updateMaterial = useEditor((s) => s.updateMaterial);
    const duplicateSelected = useEditor((s) => s.duplicateSelected);
    const deleteSelected = useEditor((s) => s.deleteSelected);

    const obj = objects.find((o) => o.id === selectedId);
    if (!obj) return null;

    return (
        <Panel data-inspector-panel>
            <Header>
                <Title>Inspector</Title>
                <CloseButton
                    onClick={() => {
                        const panel = document.querySelector(
                            "[data-inspector-panel]"
                        ) as HTMLElement;
                        if (panel) panel.style.display = "none";
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
        </Panel>
    );
}

export default Inspector;
