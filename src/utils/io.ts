import { GLTFExporter } from 'three-stdlib'
import { saveAs } from 'file-saver'
import * as THREE from 'three'
import type { SceneObject, GeometryParamsMap } from '../types'

export function buildSceneFromObjects(objects: SceneObject[]): THREE.Scene {
  const scene = new THREE.Scene()
  const light = new THREE.AmbientLight(0xffffff, 1)
  scene.add(light)
  for (const o of objects) {
    let geometry: THREE.BufferGeometry
    switch (o.geometry) {
      case 'box': {
        const p = o.geometryParams as GeometryParamsMap['box'] | undefined
        geometry = new THREE.BoxGeometry(p?.width ?? 1, p?.height ?? 1, p?.depth ?? 1)
        break
      }
      case 'sphere': {
        const p = o.geometryParams as GeometryParamsMap['sphere'] | undefined
        geometry = new THREE.SphereGeometry(p?.radius ?? 0.5, p?.widthSegments ?? 32, p?.heightSegments ?? 16)
        break
      }
      case 'cylinder': {
        const p = o.geometryParams as GeometryParamsMap['cylinder'] | undefined
        geometry = new THREE.CylinderGeometry(p?.radiusTop ?? 0.5, p?.radiusBottom ?? 0.5, p?.height ?? 1, p?.radialSegments ?? 32)
        break
      }
      case 'cone': {
        const p = o.geometryParams as GeometryParamsMap['cone'] | undefined
        geometry = new THREE.ConeGeometry(p?.radius ?? 0.5, p?.height ?? 1, p?.radialSegments ?? 32)
        break
      }
      case 'torus': {
        const p = o.geometryParams as GeometryParamsMap['torus'] | undefined
        geometry = new THREE.TorusGeometry(p?.radius ?? 0.5, p?.tube ?? 0.2, p?.radialSegments ?? 16, p?.tubularSegments ?? 64)
        break
      }
      case 'plane': {
        const p = o.geometryParams as GeometryParamsMap['plane'] | undefined
        geometry = new THREE.PlaneGeometry(p?.width ?? 1, p?.height ?? 1, p?.widthSegments ?? 1, p?.heightSegments ?? 1)
        break
      }
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(o.material.color),
      metalness: o.material.metalness,
      roughness: o.material.roughness,
      opacity: o.material.opacity,
      transparent: o.material.transparent,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(o.position.x, o.position.y, o.position.z)
    mesh.rotation.set(o.rotation.x, o.rotation.y, o.rotation.z)
    mesh.scale.set(o.scale.x, o.scale.y, o.scale.z)
    mesh.visible = o.visible
    scene.add(mesh)
  }
  return scene
}

export async function exportSceneToGLB(scene: THREE.Scene, filename = 'scene.glb') {
  const exporter = new GLTFExporter()
  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      scene,
      (gltf) => {
        try {
          if (gltf instanceof ArrayBuffer) {
            const blob = new Blob([gltf], { type: 'model/gltf-binary' })
            saveAs(blob, filename)
          } else {
            const json = JSON.stringify(gltf)
            const blob = new Blob([json], { type: 'application/json' })
            saveAs(blob, filename.replace(/\.glb$/, '.gltf'))
          }
          resolve()
        } catch (e) {
          reject(e)
        }
      },
      (error) => reject(error),
      { binary: true }
    )
  })
}
