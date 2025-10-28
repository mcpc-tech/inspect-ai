// GetRequest - no default React import required

export default function GetRequest({ value, onChange, onGet }: { value: string; onChange: (v: string) => void; onGet: () => void }) {
  return (
    <div className="flex gap-2 items-start">
      <input className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900" value={value} onChange={(e) => onChange(e.target.value)} />
      <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium" onClick={onGet}>Get</button>
    </div>
  );
}
