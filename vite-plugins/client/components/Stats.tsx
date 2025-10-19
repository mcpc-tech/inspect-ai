// Stats UI only - no React default import required

export default function Stats({ stats }: { stats: { total: number; fetch: number; xhr: number; other: number } }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition-colors">
        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600 mt-1">Total</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
        <div className="text-3xl font-bold text-gray-900">{stats.fetch}</div>
        <div className="text-sm text-gray-600 mt-1">Fetch</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
        <div className="text-3xl font-bold text-gray-900">{stats.xhr}</div>
        <div className="text-sm text-gray-600 mt-1">XHR</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition-colors">
        <div className="text-3xl font-bold text-gray-900">{stats.other}</div>
        <div className="text-sm text-gray-600 mt-1">Other</div>
      </div>
    </div>
  );
}
