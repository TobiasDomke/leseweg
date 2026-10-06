import { useEffect, useState } from "react";
export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export function isStandalone(
  display: { matches: boolean },
  navigator: { standalone?: boolean },
) {
  return display.matches || navigator.standalone === true;
}
export function useInstallation() {
  const [standalone, setStandalone] = useState(false),
    [prompt, setPrompt] = useState<InstallPrompt | null>(null),
    [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const overlay = window.matchMedia(
      "(display-mode: window-controls-overlay)",
    );
    const refresh = () =>
      setStandalone(
        isStandalone(
          display,
          navigator as Navigator & { standalone?: boolean },
        ) || overlay.matches,
      );
    const before = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installed = () => {
      setPrompt(null);
      setAccepted(true);
      refresh();
    };
    refresh();
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("pageshow", refresh);
    display.addEventListener("change", refresh);
    overlay.addEventListener("change", refresh);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("pageshow", refresh);
      display.removeEventListener("change", refresh);
      overlay.removeEventListener("change", refresh);
    };
  }, []);
  return {
    standalone,
    prompt,
    accepted,
    install: async () => {
      if (!prompt) return;
      setPrompt(null);
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === "accepted") setAccepted(true);
    },
  };
}
