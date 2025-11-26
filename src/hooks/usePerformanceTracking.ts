import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export const usePerformanceTracking = (pageName: string) => {
  useEffect(() => {
    // Capturar métricas de performance después de que la página cargue
    const captureMetrics = () => {
      try {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType("paint");
        
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
          
          let fcp = 0;
          const fcpEntry = paint.find(entry => entry.name === "first-contentful-paint");
          if (fcpEntry) {
            fcp = fcpEntry.startTime;
          }

          trackEvent("performance_metric", {
            page: pageName,
            ttfb: Math.round(ttfb),
            fcp: Math.round(fcp),
            domContentLoaded: Math.round(domContentLoaded),
            loadComplete: Math.round(loadComplete),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn("Performance tracking failed:", error);
      }
    };

    // Esperar a que la página cargue completamente
    if (document.readyState === "complete") {
      setTimeout(captureMetrics, 100);
    } else {
      window.addEventListener("load", () => setTimeout(captureMetrics, 100));
    }
  }, [pageName]);
};
