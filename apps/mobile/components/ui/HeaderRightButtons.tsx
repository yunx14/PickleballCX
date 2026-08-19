import { View, StyleSheet } from 'react-native';

import { NotificationsHeaderButton } from '@/components/ui/NotificationsHeaderButton';
import { ProfileHeaderButton } from '@/components/ui/ProfileHeaderButton';

export function HeaderRightButtons() {
  return (
    <View style={styles.row}>
      <NotificationsHeaderButton />
      <ProfileHeaderButton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
