'use client'

import { useState } from 'react'
// WICHTIG: Prüfe, ob ModelViewerComponent.tsx im selben Ordner liegt!
import ModelViewerComponent from './../components/ModelViewerComponent'

/** * This is your permanent Demo Car.
 * It is hardcoded, so it survives every refresh.
 */
const DEMO_CAR = {
  id: 'demo-lamborghini',
  name: 'Lamborghini Countach (Demo)',
  url: '/models/scene.gltf',
  isDemo: true,
}

export default function HomePage() {
  // We initialize the garage with the demo car
  const [availableModels, setAvailableModels] = useState([DEMO_CAR])
  const [currentModelUrl, setCurrentModelUrl] = useState(DEMO_CAR.url)

  // Logic to remove a car from the session
  const deleteModel = (id: string) => {
    if (id === 'demo-lamborghini') return // Safety: Demo car cannot be deleted

    setAvailableModels((prev) => prev.filter((m) => m.id !== id))

    // If the active car is deleted, clear the 3D view
    if (currentModelUrl === DEMO_CAR.url && id === 'demo-lamborghini') {
      setCurrentModelUrl('')
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f0f0]">
      {/* 3D Viewport */}
      <main className="flex-1 relative">
        {currentModelUrl ? (
          <ModelViewerComponent modelUrl={currentModelUrl} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-neutral-400 font-medium">
              Garage is empty. Refresh to restore demo.
            </p>
          </div>
        )}
      </main>

      {/* Sidebar Garage UI */}
      <aside className="w-[300px] bg-white border-l p-6 shadow-xl z-50 flex flex-col">
        <h2 className="text-xl font-black mb-6 italic tracking-tighter">GARAGE</h2>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {availableModels.map((model) => (
            <div
              key={model.id}
              className={`p-4 border rounded-xl flex justify-between items-center transition-all ${
                currentModelUrl === model.url
                  ? 'border-black bg-neutral-50 shadow-sm'
                  : 'border-neutral-100'
              }`}
            >
              <button
                onClick={() => setCurrentModelUrl(model.url)}
                className="font-bold text-xs uppercase tracking-wider text-left"
              >
                {model.name}
              </button>

              {/* Show delete only for non-demo cars */}
              {!model.isDemo ? (
                <button
                  onClick={() => deleteModel(model.id)}
                  className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase border border-red-100 px-2 py-1 rounded"
                >
                  Delete
                </button>
              ) : (
                <span className="text-[10px]" title="System Protected car">
                  🔒
                </span>
              )}
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
