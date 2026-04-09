import { VERTICAL_LABELS } from '@/lib/constants';
import { type Vertical } from '@/types/database';
import { cn } from '@/lib/utils';

const VERTICAL_STYLES: Record<Vertical, string> = {
  events_operations: 'bg-blue-50 text-blue-700 border-blue-200/80 ring-blue-500/10',
  projects_policies: 'bg-violet-50 text-violet-700 border-violet-200/80 ring-violet-500/10',
  web_design: 'bg-orange-50 text-orange-700 border-orange-200/80 ring-orange-500/10',
};

export function VerticalBadge({ vertical }: { vertical: Vertical }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ring-1',
      VERTICAL_STYLES[vertical]
    )}>
      {VERTICAL_LABELS[vertical]}
    </span>
  );
}
