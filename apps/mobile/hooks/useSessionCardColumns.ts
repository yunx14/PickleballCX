import { useWindowDimensions } from 'react-native';

import { layout, spacing } from '@/constants/theme';

export function useSessionCardColumns() {
  const { width } = useWindowDimensions();
  const gap = spacing.md;
  const horizontalPadding = spacing.xl * 2;
  const available = Math.max(layout.cardMinWidth, width - horizontalPadding);
  const columns = Math.max(
    1,
    Math.floor((available + gap) / (layout.cardMinWidth + gap)),
  );
  const cardWidth = (available - gap * (columns - 1)) / columns;

  return { columns, cardWidth, gap };
}
