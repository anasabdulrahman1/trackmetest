/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setupBackgroundMessageHandler } from './src/utils/notificationHandler';

// Setup background message handler (must be done before App registration)
setupBackgroundMessageHandler();

AppRegistry.registerComponent(appName, () => App);
