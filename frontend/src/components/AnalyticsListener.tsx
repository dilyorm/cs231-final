import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageview } from "../lib/analytics";

export default function AnalyticsListener() {
  const loc = useLocation();
  useEffect(() => {
    pageview(loc.pathname + loc.search);
  }, [loc.pathname, loc.search]);
  return null;
}
