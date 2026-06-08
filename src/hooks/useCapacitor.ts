import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export function useIsNative() {
  return Capacitor.isNativePlatform();
}

export function useCapacitorBackButton(handler: () => void) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', () => {
      handler();
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [handler]);
}

export function useCapacitorAppLifecycle(onResume?: () => void) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    if (onResume) {
      const listener = App.addListener('resume', () => {
        onResume();
      });
      return () => {
        listener.then(l => l.remove());
      };
    }
  }, [onResume]);
}
