import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from "react";
import * as THREE from "three";

interface ThreeDContextType {
    selectObject: (objectName: string) => void;
    setObjectVisibility: (objectName: string, visible: boolean) => void;
    registerObject: (
        objectName: string,
        object: THREE.Group<THREE.Object3DEventMap>
    ) => void;
    unregisterObject: (objectName: string) => void;
    setupScene: (mountRef: React.RefObject<HTMLDivElement>) => void;
    createCube: (
        objectName: string,
        position: THREE.Vector3,
        faceColor: number
    ) => THREE.Group;
    createSphere: (
        objectName: string,
        position: THREE.Vector3,
        radius: number,
        faceColor: number
    ) => THREE.Group;
    resetCamera: () => void;
    objectsRef: React.MutableRefObject<{
        [key: string]: THREE.Group<THREE.Object3DEventMap>;
    }>;
    renderScene: () => void;
    cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | undefined>;
    sceneRef: React.MutableRefObject<THREE.Scene>;
    mainGroupRef: React.MutableRefObject<THREE.Group>;
    rendererRef: React.MutableRefObject<THREE.WebGLRenderer>;
    cornerMarkersRef: React.MutableRefObject<THREE.Mesh[]>;
    zoomRef: React.MutableRefObject<number>;
    resetCameraRef: React.MutableRefObject<boolean>;
    renameObject: (oldName: string, newName: string) => void;
    updateCubeGeometry: (faceMesh: THREE.Mesh) => void;
    updateSphereGeometry: (sphereMesh: THREE.Mesh) => void;
}

const ThreeDContext = createContext<ThreeDContextType | null>(null);

export const ThreeDProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const objectsRef = useRef<{
        [key: string]: THREE.Group<THREE.Object3DEventMap>;
    }>({});

    const rendererRef = useRef<THREE.WebGLRenderer>(
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
        })
    );
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
    const mainGroupRef = useRef<THREE.Group>(new THREE.Group());
    const cornerMarkersRef = useRef<THREE.Mesh[]>([]);

    const zoomRef = useRef(1);

    const resetCameraRef = useRef(false);

    const setupScene = (mountRef: React.RefObject<HTMLDivElement>) => {
        if (!mountRef.current) return;

        const width = mountRef.current.offsetWidth;
        const height = mountRef.current.offsetHeight;

        sceneRef.current = new THREE.Scene();
        mainGroupRef.current = new THREE.Group();
        cornerMarkersRef.current = [];
        objectsRef.current = {} as any;

        rendererRef.current.setPixelRatio(window.devicePixelRatio);
        rendererRef.current.setSize(width, height);

        mountRef.current.appendChild(rendererRef.current.domElement);

        cameraRef.current = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );
        cameraRef.current.position.set(0, 3, 5);
        cameraRef.current.lookAt(0, 0, 0);

        const gridHelper = new THREE.GridHelper(1000, 1000);
        mainGroupRef.current.add(gridHelper);

        createCube("cube-1", new THREE.Vector3(0, 0, 0), 0x00ff00);

        sceneRef.current.add(mainGroupRef.current);
    };

    const renderScene = () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
            return;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    const createCube = (
        objectName: string,
        offset: THREE.Vector3,
        faceColor: number
    ): THREE.Group<THREE.Object3DEventMap> => {
        const min = new THREE.Vector3(-0.5, -0.5, -0.5);
        const max = new THREE.Vector3(0.5, 0.5, 0.5);
        const v0 = new THREE.Vector3(min.x, min.y, min.z);
        const v1 = new THREE.Vector3(min.x, min.y, max.z);
        const v2 = new THREE.Vector3(min.x, max.y, min.z);
        const v3 = new THREE.Vector3(min.x, max.y, max.z);
        const v4 = new THREE.Vector3(max.x, min.y, min.z);
        const v5 = new THREE.Vector3(max.x, min.y, max.z);
        const v6 = new THREE.Vector3(max.x, max.y, min.z);
        const v7 = new THREE.Vector3(max.x, max.y, max.z);
        const vertices = [v0, v1, v2, v3, v4, v5, v6, v7];

        const geometry = createHexahedronGeometry(vertices);

        const faceMaterial = new THREE.MeshBasicMaterial({
            color: faceColor,
            opacity: 0.5,
            transparent: true,
        });
        const hexahredronMesh = new THREE.Mesh(geometry.clone(), faceMaterial);
        hexahredronMesh.name = "faceMesh";

        for (let i = 0; i < 8; i++) {
            const markerMaterial = new THREE.MeshBasicMaterial({
                color: 0x0000ff,
            });
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                markerMaterial
            );
            marker.position.copy(vertices[i]);
            marker.userData.isCornerMarker = true as any;
            marker.userData.cornerIndex = i as any;
            hexahredronMesh.add(marker);
            cornerMarkersRef.current.push(marker);
        }

        const wireframeGeom = new THREE.WireframeGeometry(geometry.clone());
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
        });
        const wireframeMesh = new THREE.LineSegments(
            wireframeGeom,
            wireframeMaterial
        );
        wireframeMesh.name = "wireframeMesh";

        const cubeGroup = new THREE.Group();
        cubeGroup.name = objectName;
        cubeGroup.add(hexahredronMesh);
        cubeGroup.add(wireframeMesh);
        cubeGroup.position.copy(offset);

        cubeGroup.userData.updateGeometry = () => {
            updateCubeGeometry(hexahredronMesh);
            const newWireframe = new THREE.WireframeGeometry(
                hexahredronMesh.geometry as any
            );
            wireframeMesh.geometry.dispose();
            wireframeMesh.geometry = newWireframe;
        };

        registerObject(objectName, cubeGroup);
        return cubeGroup;
    };

    const createHexahedronGeometry = (
        vertices: THREE.Vector3[]
    ): THREE.BufferGeometry => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            vertices[0].x,
            vertices[0].y,
            vertices[0].z,
            vertices[1].x,
            vertices[1].y,
            vertices[1].z,
            vertices[2].x,
            vertices[2].y,
            vertices[2].z,
            vertices[3].x,
            vertices[3].y,
            vertices[3].z,
            vertices[4].x,
            vertices[4].y,
            vertices[4].z,
            vertices[5].x,
            vertices[5].y,
            vertices[5].z,
            vertices[6].x,
            vertices[6].y,
            vertices[6].z,
            vertices[7].x,
            vertices[7].y,
            vertices[7].z,
        ]);
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );
        const indices = [
            0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5, 0, 4, 5, 0, 5, 1, 2, 3, 7, 2, 7,
            6, 0, 2, 6, 0, 6, 4, 1, 5, 7, 1, 7, 3,
        ];
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    };

    const updateCubeGeometry = (hexahredronMesh: THREE.Mesh) => {
        const markers = hexahredronMesh.children.filter(
            (child) => (child as any).userData.isCornerMarker
        );
        if (markers.length !== 8) return;
        markers.sort(
            (a, b) =>
                (a as any).userData.cornerIndex -
                (b as any).userData.cornerIndex
        );
        const vertices = markers.map((marker) =>
            (marker as THREE.Object3D).position.clone()
        );
        const newGeometry = createHexahedronGeometry(vertices as any);
        (hexahredronMesh.geometry as any).dispose();
        hexahredronMesh.geometry = newGeometry;
    };

    const selectObject = (objectName: string) => {
        const object = objectsRef.current[objectName];
        if (object && object.children[0] instanceof THREE.Mesh) {
            const faceMesh = object.children[0] as THREE.Mesh;
            (faceMesh.material as THREE.MeshBasicMaterial).color.setHex(
                Math.random() * 0xffffff
            );
        }
    };

    const setObjectVisibility = (objectName: string, visible: boolean) => {
        const object = objectsRef.current[objectName];
        if (object) object.visible = visible;
    };

    const renameObject = (oldName: string, newName: string) => {
        const object = objectsRef.current[oldName];
        if (object) {
            object.name = newName;
            objectsRef.current[newName] = object;
            delete objectsRef.current[oldName];
        }
    };

    const resetCamera = () => {
        resetCameraRef.current = true;
        if (!cameraRef.current) return;
        const newPos = new THREE.Vector3(0, 3, 5);
        cameraRef.current.position.copy(newPos);
        cameraRef.current.lookAt(0, 0, 0);
        cameraRef.current.updateProjectionMatrix();
        if (mainGroupRef.current) {
            mainGroupRef.current.rotation.set(0, 0, 0);
            mainGroupRef.current.scale.set(1, 1, 1);
        }
        zoomRef.current = 1;
        renderScene();
    };

    const registerObject = (
        objectName: string,
        object: THREE.Group<THREE.Object3DEventMap>
    ) => {
        objectsRef.current[objectName] = object;
        mainGroupRef.current.add(object);
    };

    const unregisterObject = (objectName: string) => {
        const object = objectsRef.current[objectName];
        if (object && sceneRef.current) {
            sceneRef.current.remove(object);
        }
        delete objectsRef.current[objectName];
        mainGroupRef.current.remove(object);
    };

    useEffect(() => {
        // Debug log
        // console.log(objectsRef.current);
    }, [objectsRef.current]);

    const threeDContextValue: ThreeDContextType = useMemo(() => {
        return {
            selectObject,
            setObjectVisibility,
            registerObject,
            unregisterObject,
            setupScene,
            createCube,
            createSphere: () => new THREE.Group(),
            updateSphereGeometry: () => {},
            resetCamera,
            objectsRef,
            renderScene,
            cameraRef,
            sceneRef,
            mainGroupRef,
            rendererRef,
            cornerMarkersRef,
            zoomRef,
            resetCameraRef,
            renameObject,
            updateCubeGeometry,
        };
    }, []);

    return (
        <ThreeDContext.Provider value={threeDContextValue}>
            {children}
        </ThreeDContext.Provider>
    );
};

export const useThreeD = () => {
    const context = useContext(ThreeDContext);
    if (!context) {
        throw new Error("useThreeD must be used within an ThreeDProvider");
    }
    return context;
};
