// Vite development-only visual fixture. Not an entry in the production build.
import { createRoot } from "react-dom/client";
import { useState, useEffect, useRef } from "react";
import Leseweg from "../app/leseweg";
import "../app/globals.css";
function Preview() {
  const [width, setWidth] = useState("393"),
    [screen, setScreen] = useState("settings"),
    [report, setReport] = useState(""),
    frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const id = setInterval(() => {
      const d = frame.current?.contentDocument;
      if (!d?.body) return;
      const w = d.documentElement.clientWidth;
      const input = d.querySelector("input[type=time]");
      const box = input?.getBoundingClientRect(),
        card = input?.closest("section")?.getBoundingClientRect();
      const overflow = [...d.querySelectorAll("body *")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.width > 1 && r.height > 1 && (r.right > w + 1 || r.left < -1)
          );
        })
        .map((e) => ({
          tag: e.tagName,
          class: e.className,
          text: e.textContent?.slice(0, 50),
        }));
      setReport(
        JSON.stringify(
          {
            width: w,
            scrollWidth: d.documentElement.scrollWidth,
            lang: d.documentElement.lang,
            screen,
            timeContained:
              box && card
                ? box.left >= card.left && box.right <= card.right
                : null,
            overflow: overflow.slice(0, 12),
          },
          null,
          2,
        ),
      );
    }, 500);
    return () => clearInterval(id);
  }, [screen]);
  return (
    <div>
      <label>
        Test viewport{" "}
        <select value={width} onChange={(e) => setWidth(e.target.value)}>
          {["320", "375", "393", "430", "768", "1024"].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label>
        Test screen{" "}
        <select value={screen} onChange={(e) => setScreen(e.target.value)}>
          {["today", "plan", "stats", "settings"].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <pre aria-label="Layout results">{report}</pre>
      <iframe
        ref={frame}
        key={screen}
        title="Installed app preview"
        style={{
          width: Number(width),
          height: 850,
          border: "1px solid #777",
          margin: "10px auto",
          display: "block",
        }}
        src={`/tests/preview.html?frame=1&tab=${screen}`}
      />
    </div>
  );
}
if (import.meta.env.DEV)
  createRoot(document.getElementById("root")!).render(
    new URLSearchParams(location.search).get("frame") === "1" ? (
      <Leseweg
        previewInstalled
        previewTab={new URLSearchParams(location.search).get("tab") ?? "today"}
      />
    ) : (
      <Preview />
    ),
  );
