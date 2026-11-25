declare const global: any;

import * as ReactNative from 'react-native';
import { LogBox } from 'react-native';

// Ignore non-fatal React Navigation Drawer Reanimated warnings on native
LogBox.ignoreLogs([
  '[Reanimated] Dependencies should only be used on the web',
]);

// Diagnostic global error handler to capture complete stack trace of any unhandled runtime exceptions
if (typeof global !== 'undefined' && global.ErrorUtils) {
  const defaultHandler = global.ErrorUtils.getGlobalHandler?.();
  global.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.error('=== RUNTIME DIAGNOSTIC ===', error?.message || error, '\nStack:\n', error?.stack || 'No stack available');
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

// React Native 0.88 (Expo SDK 58) removed InteractionManager from core.
// Polyfill it safely on the react-native module to prevent Invariant Violation crashes
// in packages that haven't updated or during runtime property access.
try {
  const dummyInteractionManager = {
    runAfterInteractions(task?: () => any) {
      const handle = setTimeout(() => {
        if (typeof task === 'function') {
          task();
        }
      }, 0);
      return {
        then(onFulfilled?: () => any) {
          return Promise.resolve().then(onFulfilled);
        },
        done(onFulfilled?: () => any) {
          if (typeof onFulfilled === 'function') {
            onFulfilled();
          }
        },
        cancel() {
          clearTimeout(handle);
        },
      };
    },
    createInteractionHandle() {
      return 1;
    },
    clearInteractionHandle(_handle?: any) {},
    setDeadline(_deadline: number) {},
    addListener: () => ({ remove: () => {} }),
  };

  Object.defineProperty(ReactNative, 'InteractionManager', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: dummyInteractionManager,
  });

  try {
    const rnCommonJS = require('react-native');
    if (rnCommonJS && !rnCommonJS.InteractionManager) {
      rnCommonJS.InteractionManager = dummyInteractionManager;
    }
  } catch {}
} catch {
  // Ignore if already set or non-configurable
}
