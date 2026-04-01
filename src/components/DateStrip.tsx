import { cn } from '@/lib/utils';

interface DateStripProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

function getDates(): { date: string; dayName: string; dayNum: number; isToday: boolean }[] {
  const today = new Date();
  const dates: { date: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = -7; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      date: d.toISOString().split('T')[0],
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return dates;
}

export function DateStrip({ selectedDate, onSelect }: DateStripProps) {
  const dates = getDates();

  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-1 min-w-max pb-2">
        {dates.map(d => (
          <button
            key={d.date}
            onClick={() => onSelect(d.date)}
            className={cn(
              'flex flex-col items-center px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 min-w-[40px]',
              d.date === selectedDate
                ? 'bg-primary text-primary-foreground'
                : d.isToday
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <span className="font-medium text-[10px]">{d.dayName}</span>
            <span className="font-semibold text-sm">{d.dayNum}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
