import { Redirect } from 'expo-router';

// Always go to the tabs shell. The Home tab supports guest mode
// (shows content, gates actions behind login). Auth-required tabs
// prevent navigation via tabPress listener + show lock badges.
export default function IndexRoute() {
  return <Redirect href="/(tabs)" />;
}
