"use client";

import { useEffect } from "react";

type MetaSdkLoaderProps = {
  version?: string;
};

const DEFAULT_VERSION = "v24.0";

const META_SCRIPT_SRC = "https://connect.facebook.net/en_US/sdk.js";

type ResolveFn = () => void;

let isLoading = false;
let loadPromise: Promise<void> | null = null;
let loadResolve: ResolveFn | null = null;

export function waitForMetaSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Meta SDK cannot load on the server."));
  }

  if ((window as { fbSdkReady?: boolean }).fbSdkReady) {
    return Promise.resolve();
  }

  if (!loadPromise) {
    loadPromise = new Promise<void>((resolve) => {
      loadResolve = resolve;
    });

    if (!isLoading) {
      loadMetaSdk(DEFAULT_VERSION).catch((error) => {
        console.error("Failed to load Meta SDK", error);
      });
    }
  }

  return loadPromise;
}

export function MetaSdkLoader({ version = DEFAULT_VERSION }: MetaSdkLoaderProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    void loadMetaSdk(version).catch((error) => {
      console.error("Failed to load Meta SDK", error);
    });
  }, [version]);

  return null;
}

async function loadMetaSdk(version: string): Promise<void> {
  if (typeof window === "undefined") return;

  const globalWindow = window as typeof window & { fbSdkReady?: boolean };

  if (globalWindow.fbSdkReady) {
    return;
  }

  if (globalWindow.FB && !isLoading) {
    globalWindow.FB.init({
      appId: process.env.NEXT_PUBLIC_META_APP_ID!,
      autoLogAppEvents: true,
      xfbml: true,
      version,
    });
    globalWindow.fbSdkReady = true;
    loadResolve?.();
    loadResolve = null;
    return;
  }

  if (isLoading) {
    return loadPromise ?? Promise.resolve();
  }

  isLoading = true;

  if (!loadPromise) {
    loadPromise = new Promise<void>((resolve) => {
      loadResolve = resolve;
    });
  }

  return new Promise<void>((resolve, reject) => {
    const markReady = () => {
      globalWindow.fbSdkReady = true;
      loadResolve?.();
      loadResolve = null;
      resolve();
    };

    const initFacebook = () => {
      if (!globalWindow.FB) {
        reject(new Error("Meta SDK is not available on window"));
        return;
      }

      globalWindow.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID!,
        autoLogAppEvents: true,
        xfbml: true,
        version,
      });

      markReady();
    };

    globalWindow.fbAsyncInit = initFacebook;

    if (globalWindow.FB) {
      initFacebook();
      return;
    }

    let script = document.getElementById("facebook-jssdk") as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = META_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }

    script.addEventListener("load", initFacebook, { once: true });
    script.addEventListener(
      "error",
      () => {
        isLoading = false;
        loadPromise = null;
        loadResolve = null;
        reject(new Error("Failed to load Meta SDK script"));
      },
      { once: true },
    );
  });
}
