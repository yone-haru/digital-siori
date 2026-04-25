export default function Loading() {
  return (
    <div className="min-h-screen bg-paper flex flex-col pb-20 animate-pulse">
      {/* Header */}
      <div className="px-7 pt-12 pb-0">
        <div className="h-2.5 w-24 bg-line rounded mb-2" />
        <div className="h-8 w-28 bg-line rounded" />
      </div>

      <div className="flex-1 px-7 pt-6">
        {/* Hero time skeleton */}
        <div className="mb-7">
          <div className="h-2.5 w-32 bg-line rounded mb-3" />
          <div className="h-20 w-40 bg-line rounded mb-2" />
          <div className="h-2.5 w-24 bg-line rounded" />
        </div>

        {/* 4-grid skeleton */}
        <div className="grid grid-cols-2 gap-px mb-7 rounded-sm overflow-hidden bg-line">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-paper px-[18px] py-4">
              <div className="h-2.5 w-16 bg-line rounded mb-3" />
              <div className="h-9 w-12 bg-line rounded mb-1.5" />
              <div className="h-2.5 w-20 bg-line rounded" />
            </div>
          ))}
        </div>

        {/* Bar chart skeleton */}
        <div className="mb-10">
          <div className="flex justify-between items-baseline mb-4">
            <div className="h-2.5 w-16 bg-line rounded" />
            <div className="h-3 w-20 bg-line rounded" />
          </div>
          <div className="flex justify-between items-end" style={{ height: 84 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5" style={{ width: 32 }}>
                <div
                  className="w-full bg-line rounded-t-[1px]"
                  style={{ height: [20, 40, 15, 52, 35, 28, 10][i] }}
                />
                <div className="h-2.5 w-3 bg-line rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
