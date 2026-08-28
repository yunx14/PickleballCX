import { useWindowDimensions } from 'react-native';

import { layout } from '@/constants/theme';

export function useIsCompactViewport() {
  const { width } = useWindowDimensions();
  return width < layout.compactMaxWidth;
}
