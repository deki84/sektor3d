'use client'

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type Light = {
  id: string
  type: 'point' | 'directional'
  color: string
  intensity: number
  position: [number, number, number]
}

export type CameraView = 'free' | 'top' | 'front'

interface SceneState {
  cameraFov: number
  toneMappingExposure: number
  ambientLightIntensity: number
  lights: Light[]
  selectedLightId: string | null
  cameraResetTrigger: boolean
  activeView: CameraView
  softShadows: boolean
  shadowSize: number
  shadowFocus: number
  shadowSamples: number
  scene_uuid: string | null
}

interface SceneActions {
  setCameraFov: (fov: number) => void
  setToneMappingExposure: (exposure: number) => void
  setAmbientLightIntensity: (intensity: number) => void
  addLight: (type: 'point' | 'directional') => void
  selectLight: (id: string | null) => void
  updateLight: (id: string, newProps: Partial<Light>) => void
  resetCamera: () => void
  setActiveView: (view: CameraView) => void
  toggleSoftShadows: () => void
  setShadowSize: (size: number) => void
  setShadowFocus: (focus: number) => void
  setShadowSamples: (samples: number) => void
  setSceneUuid: (uuid: string) => void
}

export const useSceneStore = create<SceneState & SceneActions>((set, get) => ({
  // Defaults
  activeView: 'free',
  cameraFov: 60,
  toneMappingExposure: 1.0,
  ambientLightIntensity: 0.5,
  selectedLightId: null,
  cameraResetTrigger: false,
  softShadows: true,
  shadowSize: 25,
  shadowFocus: 0.0,
  shadowSamples: 10,
  scene_uuid: null,

  lights: [
    {
      id: uuidv4(),
      type: 'directional',
      color: '#ffffff',
      intensity: 2.5,
      position: [10, 10, 5],
    },
  ],

  // Actions
  setCameraFov: (fov) => set({ cameraFov: fov }),
  setToneMappingExposure: (exposure) => set({ toneMappingExposure: exposure }),
  setAmbientLightIntensity: (intensity) => set({ ambientLightIntensity: intensity }),

  addLight: (type) => {
    const isDirectional = type === 'directional'
    const newLight: Light = {
      id: uuidv4(),
      type,
      color: '#ffffff',
      intensity: isDirectional ? 2.5 : 10,
      position: isDirectional ? [10, 10, 5] : [0, 5, 0],
    }
    set({ lights: [...get().lights, newLight] })
  },

  selectLight: (id) => set({ selectedLightId: id }),

  updateLight: (id, newProps) =>
    set({
      lights: get().lights.map((l) => (l.id === id ? { ...l, ...newProps } : l)),
    }),

  setActiveView: (view) => set({ activeView: view }),

  resetCamera: () => set({ cameraResetTrigger: true }),

  toggleSoftShadows: () => set((s) => ({ softShadows: !s.softShadows })),
  setShadowSize: (size) => set({ shadowSize: size }),
  setShadowFocus: (focus) => set({ shadowFocus: focus }),
  setShadowSamples: (samples) => set({ shadowSamples: samples }),

  setSceneUuid: (uuid) => set({ scene_uuid: uuid }),
}))
