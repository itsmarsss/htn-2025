import * as THREE from 'three'
import type { SerializableGeometry } from '../types'

export function serializeGeometry(geometry: THREE.BufferGeometry): SerializableGeometry {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute | null
  const norm = geometry.getAttribute('normal') as THREE.BufferAttribute | null
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute | null
  const index = geometry.getIndex()
  return {
    positions: pos ? Array.from(pos.array as Float32Array) : [],
    normals: norm ? Array.from(norm.array as Float32Array) : undefined,
    uvs: uv ? Array.from(uv.array as Float32Array) : undefined,
    indices: index ? Array.from(index.array as Uint16Array | Uint32Array) : undefined,
  }
}

export function deserializeGeometry(data: SerializableGeometry): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  if (data.positions && data.positions.length > 0) {
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(data.positions), 3))
  }
  if (data.normals && data.normals.length > 0) {
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(data.normals), 3))
  }
  if (data.uvs && data.uvs.length > 0) {
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(data.uvs), 2))
  }
  if (data.indices && data.indices.length > 0) {
    const needsUint32 = Math.max(...data.indices) > 65535
    geometry.setIndex(new THREE.BufferAttribute(needsUint32 ? new Uint32Array(data.indices) : new Uint16Array(data.indices), 1))
  }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
  return geometry
}
