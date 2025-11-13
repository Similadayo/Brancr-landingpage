"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    __fbReady?: boolean;
  }
}

export async function waitForMetaSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Meta SDK cannot load on the server."));
  }

  if (window.__fbReady && window.FB) {
    return Promise.resolve();
  }

  // Poll until FB SDK is ready
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (window.__fbReady && window.FB) {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });
}

export function MetaSdkLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Define fbAsyncInit BEFORE SDK script is evaluated
    window.fbAsyncInit = function () {
      console.log("🚀 fbAsyncInit: initializing FB SDK...");

      if (!window.FB) {
        console.error("FB object not available in fbAsyncInit");
        return;
      }

      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID!,
        autoLogAppEvents: true,
        xfbml: false,
        version: "v24.0",
      });

      console.log("✅ FB.init complete");
      window.__fbReady = true;
    };

    // Handle hot reload: if FB already exists, call init immediately
    if (window.FB && !window.__fbReady) {
      console.log("FB already loaded, calling fbAsyncInit immediately");
      window.fbAsyncInit();
    }
  }, []);

  return (
    <Script
      src="https://connect.facebook.net/en_US/sdk.js"
      async
      defer
      onLoad={() => console.log("📦 FB SDK loaded")}
    />
  );
}
