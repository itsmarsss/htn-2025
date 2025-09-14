import styled from "styled-components";
import { useEditor } from "../store/editor";
import { buildSceneFromObjects, exportSceneToGLB } from "../utils/io";
import { saveObjects, loadObjects } from "../utils/local";

const Bar = styled.div`
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    background: rgba(20, 22, 28, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(10px);
  position: relative;
  z-index: 100;
`;

const Group = styled.div`
    display: flex;
    gap: 8px;
`;

const Btn = styled.button`
    background: #12141a;
    color: #e6e9ef;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 6px 10px;
    border-radius: 8px;
`;

const HiddenInput = styled.input`
    display: none;
`;
export function Topbar() {
    const undo = useEditor((s) => s.undo);
    const redo = useEditor((s) => s.redo);
    const setEditorMode = useEditor((s) => s.setEditorMode);
    const editorMode = useEditor((s) => s.editorMode);
    const clear = useEditor((s) => s.clear);
    const objects = useEditor((s) => s.objects);

    async function onExport() {
        const scene = buildSceneFromObjects(objects);
        await exportSceneToGLB(scene);
    }

    function onSave() {
        saveObjects(objects);
    }

    function onLoad() {
        const loaded = loadObjects();
        if (loaded) {
            useEditor.setState((s) => ({
                ...s,
                objects: loaded,
                selectedId: null,
                past: [],
                future: [],
            }));
        }
    }

    return (
        <Bar>
            <Group>
                <Btn onClick={() => clear()}>New</Btn>
                <Btn onClick={onSave}>Save</Btn>
                <Btn onClick={onLoad}>Load</Btn>
                <Btn
                    onClick={() =>
                        document.getElementById("import-file")?.click()
                    }
                >
                    Import
                </Btn>
                <Btn onClick={onExport}>Export</Btn>
                <HiddenInput
                    id="import-file"
                    type="file"
                    accept=".gltf,.glb,.json"
                />
            </Group>
            <Group>
                <Btn
                    onClick={() => setEditorMode("object")}
                    style={{ opacity: editorMode === "object" ? 1 : 0.7 }}
                >
                    Object
                </Btn>
                <Btn
                    onClick={() => setEditorMode("edit")}
                    style={{ opacity: editorMode === "edit" ? 1 : 0.7 }}
                >
                    Edit
                </Btn>
            </Group>
            <Group>
                <Btn onClick={undo}>Undo</Btn>
                <Btn onClick={redo}>Redo</Btn>
              <Btn onClick={() => {
          try { (useEditor as any).setState((s: any) => ({ ...s, showChatPanel: true })); } catch {}
        }}>💬</Btn>
      </Group>
        </Bar>
    );
}

export default Topbar;
