// Controls - no default React import required
export default function Controls({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex gap-2">
      <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium" onClick={onClear}>Clear</button>
      <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium" onClick={() => location.reload()}>Reload</button>
    </div>
  );
}
