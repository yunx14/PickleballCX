import { Platform } from 'react-native';

import { CourtMapView as NativeCourtMapView } from './CourtMapView.native';
import { CourtMapView as WebCourtMapView } from './CourtMapView.web';

export type { CourtMapViewProps } from './CourtMapView.types';

export const CourtMapView = Platform.OS === 'web' ? WebCourtMapView : NativeCourtMapView;
