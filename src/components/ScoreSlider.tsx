import { cn } from '@/lib/utils';

interface ScoreSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}

export function ScoreSlider({ label, value, onChange, max = 10 }: ScoreSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-mono font-semibold text-primary">{value}/{max}</span>
      </div>
      <input
        type="range"
        min={1}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-primary"
      />
    </div>
  );
}
