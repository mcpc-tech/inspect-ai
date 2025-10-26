// GetRequest - no default React import required

export default function GetRequest({ value, onChange, onGet }: { value: string; onChange: (v: string) => void; onGet: () => void }) {
  return (
    <div className="flex gap-2 items-start">
      <input className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" value={value} onChange={(e) => onChange(e.target.value)} />
      <button className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium" onClick={onGet}>Get</button>
    </div>
  );
}
