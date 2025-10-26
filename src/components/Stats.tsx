// Stats UI only - no React default import required

export default function Stats({ stats }: { stats: { total: number; fetch: number; xhr: number; other: number } }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total</div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.fetch}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fetch</div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.xhr}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">XHR</div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.other}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Other</div>
      </div>
    </div>
  );
}
