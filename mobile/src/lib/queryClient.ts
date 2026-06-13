import { QueryClient } from '@tanstack/react-query';

// 画面側は useFocusEffect で invalidate して鮮度を保つ前提。
// staleTime を短めに置き、キャッシュ表示 → 裏で再取得の stale-while-revalidate にする。
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
});
