import styled from "styled-components";
import { useEditor } from "../store/editor";
import {
    BoxIcon,
    SphereIcon,
    CylinderIcon,
    ConeIcon,
    TorusIcon,
    PlaneIcon,
} from "./ShapeIcons";

const Rail = styled.div`
    position: absolute;
    top: 56px;
    bottom: 12px;
    left: 12px;
    width: 52px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Btn = styled.button`
    width: 52px;
    height: 40px;
    background: rgba(18, 20, 26, 0.9);
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(18, 20, 26, 1);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
`;

export function Toolbar() {
    const add = useEditor((s) => s.addObject);
    const editorMode = useEditor((s) => s.editorMode);

    return (
        <Rail>
            {/* Shape buttons - only show in object and edit modes */}
            {editorMode !== "render" && (
                <>
                    <Btn onClick={() => add("box")} title="Add Box">
                        <BoxIcon size={20} />
                    </Btn>
                    <Btn onClick={() => add("sphere")} title="Add Sphere">
                        <SphereIcon size={20} />
                    </Btn>
                    <Btn onClick={() => add("cylinder")} title="Add Cylinder">
                        <CylinderIcon size={20} />
                    </Btn>
                    <Btn onClick={() => add("cone")} title="Add Cone">
                        <ConeIcon size={20} />
                    </Btn>
                    <Btn onClick={() => add("torus")} title="Add Torus">
                        <TorusIcon size={20} />
                    </Btn>
                    <Btn onClick={() => add("plane")} title="Add Plane">
                        <PlaneIcon size={20} />
                    </Btn>
                </>
            )}

            {/* Lighting buttons removed for render mode */}
        </Rail>
    );
}

export default Toolbar;
