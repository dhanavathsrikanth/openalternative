export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  )
}