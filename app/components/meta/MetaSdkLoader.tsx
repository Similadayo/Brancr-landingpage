"use client";

import { useEffect } from "react";
import Script from "next/script";

type MetaSdkLoaderProps = {
  version?: string;
};

const DEFAULT_VERSION = "v24.0";

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let initResolve: (() => void) | null = null;

export function waitForMetaSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Meta SDK cannot load on the server."));
  }

  if (isInitialized && window.FB) {
    return Promise.resolve();
  }

  if (!initPromise) {
    initPromise = new Promise<void>((resolve) => {
      initResolve = resolve;
    });
  }

  return initPromise;
}

export function MetaSdkLoader({ version = DEFAULT_VERSION }: MetaSdkLoaderProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Define fbAsyncInit BEFORE the script loads (as per Meta docs)
    window.fbAsyncInit = function () {
      if (!window.FB) {
        console.error("FB object not available in fbAsyncInit");
        return;
      }

      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID!,
        autoLogAppEvents: true,
        xfbml: true,
        version,
      });

      console.log("Meta SDK initialized successfully");
      isInitialized = true;

      if (initResolve) {
        initResolve();
        initResolve = null;
      }
    };

    // If FB already exists (hot reload scenario), initialize immediately
    if (window.FB && !isInitialized) {
      window.fbAsyncInit();
    }
  }, [version]);

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        async
        defer
        crossOrigin="anonymous"
      />
    </>
  );
}
