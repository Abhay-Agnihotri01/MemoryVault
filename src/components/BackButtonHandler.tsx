'use client';

import { useEffect } from 'react';

export default function BackButtonHandler() {
  useEffect(() => {
    let activeListener: any = null;

    const initBackButton = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        
        // Only register the native backButton listener if we are running inside a native app shell (Android/iOS)
        if (!Capacitor.isNativePlatform()) {
          return;
        }

        const { App } = await import('@capacitor/app');

        activeListener = await App.addListener('backButton', (data) => {
          if (data.canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
      } catch (error) {
        console.error("Failed to initialize Capacitor backButton handler:", error);
      }
    };

    initBackButton();

    // Clean up the native listener when component unmounts
    return () => {
      if (activeListener) {
        activeListener.remove();
      }
    };
  }, []);

  return null;
}
