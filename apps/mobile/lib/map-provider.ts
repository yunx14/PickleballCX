import Constants from 'expo-constants';
import { PROVIDER_GOOGLE } from 'react-native-maps';

/** Google Maps tiles need a native EAS build. Expo Go shows a blank map with PROVIDER_GOOGLE. */
export function getMapProvider() {
  if (Constants.appOwnership === 'expo') {
    return undefined;
  }
  return PROVIDER_GOOGLE;
}
