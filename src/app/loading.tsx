export default function Loading() {
  return (
    <main className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E699] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </main>
  )
}