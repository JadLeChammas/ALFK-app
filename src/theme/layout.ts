import { useWindowDimensions } from 'react-native';

import { breakpoints } from './tokens';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= breakpoints.desktop;
  const isTablet = width >= breakpoints.tablet && !isDesktop;
  const isMobile = width < breakpoints.tablet;
  return { width, height, isDesktop, isTablet, isMobile, isWide: width >= breakpoints.wide };
}
