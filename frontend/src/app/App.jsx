import AppProviders from "./AppProviders.jsx";
import Router from "./router.jsx";
import Settings from "@/shared/components/settings/index.jsx";
import { ChartStyle } from "@/shared/components/chart/index.js";
import ScrollToTop from "@/shared/components/ScrollToTop.js";
import { ProgressBarStyle } from "@/shared/components/ProgressBar.jsx";

export default function App() {
  return (
    <AppProviders>
      <ProgressBarStyle />
      <ChartStyle />
      <Settings />
      <ScrollToTop />
      <Router />
    </AppProviders>
  );
}
