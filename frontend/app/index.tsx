import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to tabs (main app)
  return <Redirect href="/(tabs)" />;
}
