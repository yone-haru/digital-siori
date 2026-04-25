export default function Loading() {
  return (
    <div className="min-h-screen bg-paper flex flex-col animate-pulse">
      {/* Top bar */}
      <div className="flex justify-between items-center px-7 py-3">
        <div className="w-6 h-6 bg-line rounded" />
        <div className="h-2.5 w-10 bg-line rounded" />
        <div className="w-6 h-6" />
      </div>

      <div className="px-7 pt-4">
        {/* Search bar */}
        <div className="h-11 bg-line-2 border border-line rounded-sm mb-6" />

        {/* Result items */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-4 border-b border-line">
            <div className="w-10 bg-line rounded" style={{ height: 56 }} />
            <div className="flex-1 flex flex-col gap-2 py-1">
              <div className="h-3 bg-line rounded w-3/4" />
              <div className="h-2.5 bg-line rounded w-1/2" />
            </div>
            <div className="w-12 h-7 bg-line rounded self-center" />
          </div>
        ))}
      </div>
    </div>
  );
}
