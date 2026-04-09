import { cn } from '@/lib/utils';

interface StatusCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
}

const colorMap = {
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-600',
    accent: 'border-l-emerald-500',
  },
  blue: {
    icon: 'bg-blue-500/10 text-blue-600',
    accent: 'border-l-blue-500',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-600',
    accent: 'border-l-amber-500',
  },
  red: {
    icon: 'bg-red-500/10 text-red-600',
    accent: 'border-l-red-500',
  },
  purple: {
    icon: 'bg-purple-500/10 text-purple-600',
    accent: 'border-l-purple-500',
  },
};

export function StatusCard({ label, value, subtext, icon: Icon, color = 'emerald' }: StatusCardProps) {
  const colors = colorMap[color];
  return (
    <div className={cn(
      'bg-card rounded-xl border shadow-card hover:shadow-card-hover transition-shadow duration-200 p-4 border-l-[3px]',
      colors.accent
    )}>
      <div className="flex items-start gap-3.5">
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}
