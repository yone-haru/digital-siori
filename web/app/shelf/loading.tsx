export default function Loading() {
  return (
    <div className="min-h-screen bg-paper flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-end px-7 pt-12 pb-0">
        <div>
          <div className="h-2.5 w-14 bg-line rounded mb-2" />
          <div className="h-8 w-20 bg-line rounded" />
        </div>
        <div className="w-8 h-8 rounded-full bg-line mb-1" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 px-7 pt-4 pb-0">
        {[56, 64, 48, 48].map((w, i) => (
          <div key={i} className="h-7 rounded-full bg-line" style={{ width: w }} />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="px-7 pt-6 pb-28">
        <div className="h-2.5 w-16 bg-line rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="bg-line rounded" style={{ aspectRatio: "2/3" }} />
              <div className="h-2.5 bg-line rounded w-3/4" />
              <div className="h-2 bg-line rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
