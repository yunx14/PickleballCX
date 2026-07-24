import { brand } from './brand';

export const stackScreenOptions = {
  headerStyle: { backgroundColor: brand.background },
  headerShadowVisible: false,
  headerTintColor: brand.text,
  headerTitleStyle: { fontWeight: '800' as const, color: brand.text },
  contentStyle: { backgroundColor: brand.background },
};
