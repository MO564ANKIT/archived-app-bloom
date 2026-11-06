import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { PageId } from '@/components/layout/BottomNav';
import { PAGE_PATHS } from '@/lib/pageRoutes';

export function usePageNavigate(): (page: PageId) => void {
  const navigate = useNavigate();
  return useCallback(
    (page: PageId) => {
      void navigate({ to: PAGE_PATHS[page] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate],
  );
}
