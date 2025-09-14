import styled from "styled-components";
import { useEditor } from "../store/editor";

const Panel = styled.div`
    position: absolute;
    bottom: 12px;
    left: 228px;
    display: flex;
    height: 50px;
    gap: 8px;
    align-items: center;
    background: rgba(18, 20, 26, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 8px 10px;
    border-radius: 10px;
`;

const Label = styled.label`
    opacity: 0.8;
    font-size: 12px;
`;

const Input = styled.input`
    width: 64px;
    background: #0f1116;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e9ef;
    border-radius: 6px;
    padding: 4px 6px;
`;

export function SnapPanel() {
    const snap = useEditor((s) => s.snap);
    const toggle = useEditor((s) => s.toggleSnap);
    const setSnap = useEditor((s) => s.setSnap);
    return (
        <Panel>
            <Label>
                <input
                    type="checkbox"
                    checked={snap.enableSnapping}
                    onChange={(e) => toggle(e.target.checked)}
                />{" "}
                Snap
            </Label>
            <Label>
                Move
                <Input
                    type="number"
                    step="0.1"
                    value={snap.translateSnap}
                    onChange={(e) =>
                        setSnap({ translateSnap: parseFloat(e.target.value) })
                    }
                />
            </Label>
            <Label>
                Rotate
                <Input
                    type="number"
                    step="0.01"
                    value={snap.rotateSnap}
                    onChange={(e) =>
                        setSnap({ rotateSnap: parseFloat(e.target.value) })
                    }
                />
            </Label>
            <Label>
                Scale
                <Input
                    type="number"
                    step="0.01"
                    value={snap.scaleSnap}
                    onChange={(e) =>
                        setSnap({ scaleSnap: parseFloat(e.target.value) })
                    }
                />
            </Label>
        </Panel>
    );
}

export default SnapPanel;
