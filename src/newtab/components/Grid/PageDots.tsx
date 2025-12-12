import { useIconStore } from '../../stores';
import { cn } from '../../utils';

interface PageDotsProps {
  className?: string;
}

/**
 * PageDots Component
 * Renders pagination dots for the icon grid
 * Optimized with shallow selector to prevent unnecessary rerenders
 */
export function PageDots({ className }: PageDotsProps) {
  // P2-4: Use fine-grained selectors for performance
  const currentPage = useIconStore(state => state.currentPage);
  const getTotalPages = useIconStore(state => state.getTotalPages);
  const setCurrentPage = useIconStore(state => state.setCurrentPage);

  const totalPages = getTotalPages();

  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <button
          key={index}
          onClick={() => setCurrentPage(index)}
          className={cn(
            'rounded-full transition-all duration-200',
            index === currentPage
              ? 'w-6 h-2 bg-white'
              : 'w-2 h-2 bg-white/40 hover:bg-white/60'
          )}
          aria-label={`Go to page ${index + 1}`}
          aria-current={index === currentPage ? 'page' : undefined}
        />
      ))}
    </div>
  );
}

export default PageDots;
