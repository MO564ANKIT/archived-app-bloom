import { CATEGORY_META, type Category } from '@/lib/categories';
import { cn } from '@/lib/cn';
import { categoryIcon } from '@/components/kit/categoryIcons';

export function CategoryTag({ category, className }: { category: Category; className?: string }) {
  const Icon = categoryIcon(category);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-ink-200',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 text-neon-400" aria-hidden="true" />
      {CATEGORY_META[category].label}
    </span>
  );
}
