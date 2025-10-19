import { Button } from './ui/button';

export default function Controls({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onClear}>
        Clear
      </Button>
      <Button variant="outline" onClick={() => location.reload()}>
        Reload
      </Button>
    </div>
  );
}
