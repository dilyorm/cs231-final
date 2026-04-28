declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = "G-F7BRQG32BH";

export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

export function pageview(path: string, title?: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
    send_to: GA_ID,
  });
}

export function setUser(userId: number | string | null) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_ID, { user_id: userId ? String(userId) : undefined });
}
