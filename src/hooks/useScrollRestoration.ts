import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// CREDIT: https://gist.github.com/claus/992a5596d6532ac91b24abe24e10ae81

function saveScrollPos(asPath: string) {
  sessionStorage.setItem(
    `scrollPos:${asPath}`,
    JSON.stringify({ x: window.scrollX, y: window.scrollY })
  );
}

function restoreScrollPos(asPath: string) {
  const json = sessionStorage.getItem(`scrollPos:${asPath}`);
  const scrollPos = json ? JSON.parse(json) : undefined;
  if (scrollPos) {
    window.scrollTo(scrollPos.x, scrollPos.y);
  }
}

export function useScrollRestoration() {
  const router = useRouter();
  const [shouldScrollRestore, setShouldScrollRestore] =
    useState<boolean>(false);

  useEffect(() => {
    if (shouldScrollRestore) {
      restoreScrollPos(router.asPath);
    }
  }, [router.asPath, shouldScrollRestore]);

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    window.history.scrollRestoration = "manual";

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      saveScrollPos(router.asPath);
      delete event["returnValue"];
    };

    const onRouteChangeStart = () => {
      saveScrollPos(router.asPath);
    };

    const onRouteChangeComplete = () => {
      setShouldScrollRestore(false);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    router.events.on("routeChangeStart", onRouteChangeStart);
    router.events.on("routeChangeComplete", onRouteChangeComplete);
    router.beforePopState(() => {
      setShouldScrollRestore(true);
      return true;
    });

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      router.events.off("routeChangeStart", onRouteChangeStart);
      router.events.off("routeChangeComplete", onRouteChangeComplete);
      router.beforePopState(() => true);
    };
  }, [router, shouldScrollRestore]);
}
