import { useMemo, useState } from "react";
import styled from "styled-components";
import { useEditor } from "../store/editor";

const Panel = styled.div`
    position: absolute;
    bottom: 12px;
    right: 308px;
    display: flex;
    gap: 8px;
    align-items: center;
    height: 50px;
    background: rgba(18, 20, 26, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 8px 10px;
    border-radius: 10px;
`;

const Select = styled.select`
    background: #0f1116;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e9ef;
    border-radius: 6px;
    padding: 6px 8px;
`;

const Btn = styled.button`
    background: #12141a;
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 6px 10px;
    border-radius: 8px;
`;

export function BooleanPanel() {
    const objects = useEditor((s) => s.objects);
    const booleanOp = useEditor((s) => s.booleanOp);
    const [aId, setA] = useState<string>("");
    const [bId, setB] = useState<string>("");

    const options = useMemo(
        () => objects.map((o) => ({ id: o.id, name: o.name })),
        [objects]
    );

    return (
        <Panel>
            <Select value={aId} onChange={(e) => setA(e.target.value)}>
                <option value="">A</option>
                {options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.name}
                    </option>
                ))}
            </Select>
            <Select value={bId} onChange={(e) => setB(e.target.value)}>
                <option value="">B</option>
                {options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.name}
                    </option>
                ))}
            </Select>
            <Btn
                disabled={!aId || !bId}
                onClick={() => booleanOp("union", aId, bId)}
            >
                Union
            </Btn>
            <Btn
                disabled={!aId || !bId}
                onClick={() => booleanOp("subtract", aId, bId)}
            >
                Subtract
            </Btn>
            <Btn
                disabled={!aId || !bId}
                onClick={() => booleanOp("intersect", aId, bId)}
            >
                Intersect
            </Btn>
        </Panel>
    );
}

export default BooleanPanel;
