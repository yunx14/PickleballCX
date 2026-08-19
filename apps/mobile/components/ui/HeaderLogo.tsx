import { Image, StyleSheet } from 'react-native';

export function HeaderLogo() {
  return (
    <Image
      accessibilityRole="image"
      accessibilityLabel="PickleballCX"
      source={require('../../assets/images/logo.png')}
      resizeMode="contain"
      style={styles.logo}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 52,
    height: 32,
  },
});
