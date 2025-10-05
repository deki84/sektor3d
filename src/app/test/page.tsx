export default function TailwindTestPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center">
      <h1 className="text-6xl font-bold text-indigo-600 mb-6">Tailwind CSS funktioniert ✅</h1>

      <p className="text-lg text-gray-700 mb-8 max-w-md">
        Wenn du diese Seite mit <span className="font-semibold text-indigo-500">bunten Texten</span>
        und einem farbigen Hintergrund siehst, ist Tailwind aktiv und korrekt eingerichtet!
      </p>

      <div className="flex gap-4">
        <button className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition">
          Test-Button
        </button>
        <button className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition">
          Zweiter Button
        </button>
      </div>

      <div className="mt-10 text-sm text-gray-500">
        <p>© 2025 Tailwind Testseite – erstellt zur Überprüfung der Konfiguration</p>
      </div>
    </main>
  )
}
