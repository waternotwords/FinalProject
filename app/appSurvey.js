import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

export default function AppSurvey() {
  return (
    <WebView
      style={styles.container}
      source={{ uri: 'https://forms.gle/BHcMexXpikbj23oF6' }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

