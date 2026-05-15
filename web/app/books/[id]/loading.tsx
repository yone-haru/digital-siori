export default function Loading() {
  return (
    <div className="min-h-screen bg-paper flex flex-col animate-pulse">
      {/* Top bar */}
      <div className="flex justify-between items-center px-7 py-3">
        <div className="w-6 h-6 bg-line rounded" />
        <div className="h-2.5 w-10 bg-line rounded" />
        <div className="w-6 h-6" />
      </div>

      <div className="flex-1 px-7 pb-28">
        {/* Book info row */}
        <div className="flex gap-5 mb-7">
          <div className="w-20 bg-line rounded" style={{ height: 116 }} />
          <div className="flex-1 flex flex-col gap-2 pt-1">
            <div className="h-2.5 w-24 bg-line rounded" />
            <div className="h-6 w-full bg-line rounded" />
            <div className="h-6 w-3/4 bg-line rounded" />
            <div className="h-2.5 w-10 bg-line rounded" />
            <div className="flex gap-2 mt-auto">
              <div className="h-7 w-16 bg-line rounded" />
              <div className="h-7 w-20 bg-line rounded" />
            </div>
          </div>
        </div>

        {/* Progress hero */}
        <div className="bg-line-2 rounded-sm p-5 mb-4">
          <div className="flex justify-between mb-3">
            <div>
              <div className="h-2.5 w-16 bg-line rounded mb-2" />
              <div className="h-16 w-24 bg-line rounded" />
            </div>
            <div className="text-right">
              <div className="h-2.5 w-20 bg-line rounded mb-2" />
              <div className="h-4 w-24 bg-line rounded" />
            </div>
          </div>
          <div className="h-[2px] bg-line rounded mb-2" />
          <div className="flex justify-between">
            <div className="h-3 w-8 bg-line rounded" />
            <div className="h-3 w-16 bg-line rounded" />
            <div className="h-3 w-8 bg-line rounded" />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-6">
          <div className="flex-1 bg-bg rounded-sm p-3">
            <div className="h-2.5 w-16 bg-line rounded mb-2" />
            <div className="h-6 w-20 bg-line rounded" />
          </div>
          <div className="flex-1 bg-bg rounded-sm p-3">
            <div className="h-2.5 w-16 bg-line rounded mb-2" />
            <div className="h-6 w-12 bg-line rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
