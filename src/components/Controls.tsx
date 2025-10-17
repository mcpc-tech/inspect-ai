// Controls - no default React import required
export default function Controls({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex gap-2">
      <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium" onClick={onClear}>Clear</button>
      <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium" onClick={() => location.reload()}>Reload</button>
    </div>
  );
}
