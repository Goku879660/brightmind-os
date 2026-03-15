import { BlockCategory } from '@/types/focus';
import { cn } from '@/lib/utils';

const categoryStyles: Record<BlockCategory, string> = {
  planning: 'bg-category-planning/10 border-category-planning/30 text-category-planning',
  deepwork: 'bg-category-deepwork/10 border-category-deepwork/30 text-category-deepwork',
  execution: 'bg-category-execution/10 border-category-execution/30 text-category-execution',
  learning: 'bg-category-learning/10 border-category-learning/30 text-category-learning',
  break: 'bg-category-break/10 border-category-break/30 text-category-break',
};

const categoryLabels: Record<BlockCategory, string> = {
  planning: 'Planning',
  deepwork: 'Deep Work',
  execution: 'Execution',
  learning: 'Learning',
  break: 'Break',
};

interface TimeBlockCardProps {
  title: string;
  category: BlockCategory;
  startTime: string;
  endTime: string;
  compact?: boolean;
}

export function TimeBlockCard({ title, category, startTime, endTime, compact }: TimeBlockCardProps) {
  return (
    <div className={cn(
      'border rounded-lg px-3 py-2 transition-colors duration-150',
      categoryStyles[category],
      compact ? 'text-xs' : 'text-sm'
    )}>
      <div className="flex items-center justify-between">
        <span className="font-medium truncate">{title}</span>
        <span className={cn('font-medium opacity-70', compact ? 'text-[10px]' : 'text-xs')}>
          {categoryLabels[category]}
        </span>
      </div>
      <div className={cn('opacity-60 mt-0.5', compact ? 'text-[10px]' : 'text-xs')}>
        {startTime} – {endTime}
      </div>
    </div>
  );
}
