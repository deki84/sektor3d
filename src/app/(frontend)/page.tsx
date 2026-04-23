'use client' // We need this because we use State for the Garage
import { useState } from 'react'
import ModelViewerComponent from './../components/ModelViewerComponent'

/** * PERMANENT DEMO DATA
 * This stays in the code. It cannot be deleted from the database.
 * On every page refresh, this object is re-loaded into the state.
 */
const DEMO_CAR = {
  id: 'demo-lamborghini',
  name: 'Lamborghini Countach (Demo)',
  url: '/models/scene.gltf',
  isDemo: true,
}

export default function HomePage() {
  // SESSION STATE: The list of cars currently available in the UI
  const [availableModels, setAvailableModels] = useState([DEMO_CAR])

  // SELECTION STATE: The car currently shown in the 3D viewer
  const [currentModelUrl, setCurrentModelUrl] = useState(DEMO_CAR.url)

  /**
   * SESSION DELETE:
   * Removes the car from the UI list. Since we are not calling a database
   * delete for the DEMO_CAR, a simple refresh brings it back.
   */
  const deleteModel = (id: string) => {
    // 1. Remove from the local list
    setAvailableModels((prev) => prev.filter((model) => model.id !== id))

    // 2. If the user deletes the car they are currently looking at, clear the viewer
    const modelToDelete = availableModels.find((m) => m.id === id)
    if (modelToDelete?.url === currentModelUrl) {
      setCurrentModelUrl('')
    }
  }

  return (
    <div className="home flex flex-col h-screen">
      {/* 3D VIEWPORT AREA */}
      <div className="flex-1 relative bg-[#f0f0f0]">
        {currentModelUrl ? (
          <ModelViewerComponent modelUrl={currentModelUrl} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-neutral-500 font-medium">Garage is empty.</p>
              <p className="text-neutral-400 text-xs">Refresh the page to restore the demo car.</p>
            </div>
          </div>
        )}
      </div>

      {/* MINI GARAGE INTERFACE (Overlay or Bottom Bar) */}
      <div className="absolute bottom-10 left-10 z-50 flex gap-4">
        {availableModels.map((model) => (
          <div
            key={model.id}
            className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white flex items-center gap-4"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Vehicle
              </p>
              <p className="text-sm font-bold text-neutral-900">{model.name}</p>
            </div>

            <button
              onClick={() => deleteModel(model.id)}
              className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all text-[10px] font-bold uppercase"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
