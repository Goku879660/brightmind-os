import { cn } from '@/lib/utils';

interface TaskChecklistProps {
  tasks: string[];
  completion: Record<string, boolean>;
  onToggle: (task: string, checked: boolean) => void;
}

export function TaskChecklist({ tasks, completion, onToggle }: TaskChecklistProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>
      <div className="space-y-1">
        {tasks.map((task, i) => {
          const done = completion[task] || false;
          return (
            <label key={i} className="flex items-center gap-3 py-1.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={done}
                onChange={e => onToggle(task, e.target.checked)}
                className="accent-primary h-4 w-4 shrink-0"
              />
              <span className={cn(
                'text-sm transition-colors duration-150',
                done ? 'line-through text-muted-foreground' : 'text-foreground'
              )}>
                {task}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
