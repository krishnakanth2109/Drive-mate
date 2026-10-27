import * as ReactNative from 'react-native';

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
} catch {
  // Ignore if already set or non-configurable
}
