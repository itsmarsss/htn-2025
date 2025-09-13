import type { SceneObject } from '../types'

const KEY = 'ai-blender-scene'

export function saveObjects(objects: SceneObject[]) {
  const json = JSON.stringify(objects)
  localStorage.setItem(KEY, json)
}

export function loadObjects(): SceneObject[] | null {
  const json = localStorage.getItem(KEY)
  if (!json) return null
  try {
    return JSON.parse(json) as SceneObject[]
  } catch {
    return null
  }
}
