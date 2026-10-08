import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DEVICES, Device } from "../data";
import { M } from "../motion";

const SF = "system-ui,-apple-system,sans-serif";
const GRADIENT = "linear-gradient(135deg, #007A8B 0%, #3AAF4D 37%, #A8CB38 86%)";

const SpeedometerSVG = () => (
  <svg width="30" height="30" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27.0033 51.2351H29.681M15.5259 51.2351H18.2036M11 26.0751V23.8699C10.9962 21.1908 11.7648 18.5674 13.2137 16.3139C14.6627 14.0604 16.7306 12.2724 19.1697 11.164L26.5202 7.8247C26.7024 7.74185 26.8995 7.69654 27.0996 7.69146C27.2997 7.68637 27.4987 7.72163 27.6849 7.79512C27.8711 7.86862 28.0406 7.97885 28.1833 8.11924C28.3259 8.25963 28.4389 8.42729 28.5154 8.61226L32.6527 18.126C33.6011 20.3106 34.0976 22.6645 34.1123 25.046V26.0961M27.7803 45.5226H17.2795C17.0552 45.5226 16.8332 45.4783 16.6261 45.3921C16.419 45.306 16.231 45.1797 16.0729 45.0207C15.9148 44.8616 15.7897 44.6728 15.7049 44.4652C15.62 44.2576 15.577 44.0353 15.5784 43.811V28.7528C15.5756 28.5277 15.6175 28.3042 15.7018 28.0954C15.786 27.8866 15.9109 27.6965 16.0692 27.5363C16.2274 27.3761 16.4159 27.249 16.6236 27.1622C16.8314 27.0754 17.0543 27.0307 17.2795 27.0307H27.6963C27.9215 27.0307 28.1444 27.0754 28.3522 27.1622C28.56 27.249 28.7485 27.3761 28.9067 27.5363C29.0649 27.6965 29.1898 27.8866 29.274 28.0954C29.3583 28.3042 29.4002 28.5277 29.3974 28.7528V43.853C29.4031 44.2884 29.2362 44.7084 28.9332 45.0213C28.6302 45.3341 28.2157 45.5143 27.7803 45.5226ZM29.492 57H15.6204C15.0109 56.9972 14.4079 56.8745 13.8458 56.6387C13.2838 56.4029 12.7736 56.0587 12.3446 55.6257C11.9156 55.1928 11.576 54.6796 11.3453 54.1154C11.1146 53.5512 10.9973 52.9471 11 52.3376V26.0856C10.9973 25.4761 11.1146 24.872 11.3453 24.3078C11.576 23.7437 11.9156 23.2305 12.3446 22.7975C12.7736 22.3646 13.2838 22.0204 13.8458 21.7846C14.4079 21.5488 15.0109 21.426 15.6204 21.4233H29.492C30.1015 21.426 30.7045 21.5488 31.2665 21.7846C31.8286 22.0204 32.3387 22.3646 32.7677 22.7975C33.1968 23.2305 33.5364 23.7437 33.7671 24.3078C33.9978 24.872 34.1151 25.4761 34.1123 26.0856V52.3376C34.1151 52.9471 33.9978 53.5512 33.7671 54.1154C33.5364 54.6796 33.1968 55.1928 32.7677 55.6257C32.3387 56.0587 31.8286 56.4029 31.2665 56.6387C30.7045 56.8745 30.1015 56.9972 29.492 57ZM22.5824 52.7997C22.8953 52.8038 23.2022 52.7147 23.4642 52.5438C23.7262 52.3728 23.9314 52.1276 24.0535 51.8396C24.1757 51.5515 24.2093 51.2336 24.15 50.9264C24.0908 50.6192 23.9414 50.3366 23.7209 50.1147C23.5004 49.8927 23.2189 49.7414 22.9121 49.6801C22.6053 49.6188 22.2871 49.6502 21.9983 49.7704C21.7094 49.8906 21.4629 50.0941 21.2902 50.355C21.1174 50.6158 21.0262 50.9222 21.0283 51.2351C21.0338 51.6446 21.1996 52.0356 21.4902 52.3242C21.7807 52.6128 22.1729 52.7759 22.5824 52.7787V52.7997ZM48.5194 11.605L32.8942 18.525L29.1979 10.1244L44.8546 3.15186C45.068 3.05678 45.2982 3.00527 45.5318 3.00038C45.7653 2.9955 45.9975 3.03733 46.2146 3.12341C46.4318 3.20949 46.6296 3.33811 46.7964 3.50168C46.9631 3.66525 47.0955 3.86049 47.1858 4.07594L49.4225 9.23184C49.6137 9.66363 49.626 10.1536 49.4567 10.5944C49.2875 11.0353 48.9504 11.3911 48.5194 11.584V11.605Z"
      stroke="white" strokeWidth="2.14" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function SignalBars({ strength, active }: { strength: number; active?: boolean }) {
  const heights = [8, 13, 18, 24];
  return (
    <div className="flex items-end gap-[2px]">
      {heights.map((h, i) => (
        <div key={i} className="gf-signal-bar" style={{
          height: h,
          background: i < strength ? (active ? "white" : "#007A8B") : "rgba(0,0,0,0.15)",
        }} />
      ))}
    </div>
  );
}

interface Props {
  onSelect: (d: Device) => void;
}

export default function Beat2Device({ onSelect }: Props) {
  const [phase, setPhase] = useState<"scanning" | "found">("scanning");
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [radarVisible, setRadarVisible] = useState(true);
  const radarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tls = useRef<gsap.core.Timeline[]>([]);

  // Radar ring loop
  useEffect(() => {
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const tl = gsap.timeline({ repeat: -1, delay: i * 0.8 });
      tl.fromTo(ring, { scale: 1, opacity: 0.5 }, { scale: 3.2, opacity: 0, duration: 2.4, ease: "power1.out" });
      tls.current.push(tl);
    });
    return () => { tls.current.forEach(t => t.kill()); tls.current = []; };
  }, []);

  // Simulate device discovery
  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase("found");
      const nonDelayed = DEVICES.filter(d => !d.delayed);
      nonDelayed.forEach((d, i) => {
        setTimeout(() => setDevices(prev => prev.find(x => x.serial === d.serial) ? prev : [...prev, d]), i * 500);
      });
    }, 1400);
    const t2 = setTimeout(() => {
      const delayed = DEVICES.filter(d => d.delayed);
      delayed.forEach((d, i) => {
        setTimeout(() => setDevices(prev => prev.find(x => x.serial === d.serial) ? prev : [...prev, d]), i * 500);
      });
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Hide radar 2-3s after first device detected
  const radarHideScheduled = useRef(false);
  useEffect(() => {
    if (devices.length > 0 && !radarHideScheduled.current) {
      radarHideScheduled.current = true;
      setTimeout(() => {
        if (radarRef.current) {
          gsap.to(radarRef.current, {
            opacity: 0, scale: 0.85, duration: 0.5, ease: "power2.in",
            onComplete: () => setRadarVisible(false),
          });
        }
        if (gridRef.current) {
          gsap.fromTo(gridRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: M.enter, delay: 0.15 },
          );
        }
      }, 2200);
    }
  }, [devices.length]);

  // Animate device cards as they arrive
  const prevLen = useRef(0);
  useEffect(() => {
    if (devices.length > prevLen.current) {
      const cards = document.querySelectorAll(`[data-device-card="${devices[devices.length - 1]?.serial}"]`);
      cards.forEach(card => {
        gsap.fromTo(card, { opacity: 0, x: 32, scale: 0.92 }, { opacity: 1, x: 0, scale: 1, duration: M.base * 0.7, ease: M.pop });
      });
    }
    prevLen.current = devices.length;
  }, [devices.length]);

  function handleConnect(d: Device) {
    if (connecting || selected) return;
    setConnecting(d.serial);
    setTimeout(() => {
      setConnecting(null);
      setSelected(d.serial);
      setTimeout(() => onSelect(d), 400);
    }, 900);
  }

  function rescan() {
    setPhase("scanning");
    setDevices([]);
    setSelected(null);
    setConnecting(null);
    setRadarVisible(true);
    radarHideScheduled.current = false;
    if (radarRef.current) gsap.to(radarRef.current, { scale: 1, opacity: 1, duration: M.base, ease: M.morph });
    setTimeout(() => {
      setPhase("found");
      DEVICES.forEach((d, i) => {
        setTimeout(() => setDevices(prev => prev.find(x => x.serial === d.serial) ? prev : [...prev, d]), i * 500);
      });
    }, 1400);
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full" style={{ maxWidth: 760 }}>

      {/* Radar — hidden after devices detected */}
      {radarVisible && (
        <div ref={radarRef} className="relative flex items-center justify-center" style={{ width: 168, height: 168 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              ref={el => { ringsRef.current[i] = el; }}
              className="absolute rounded-full border-2"
              style={{ width: 168, height: 168, borderColor: "rgba(0,122,139,0.35)", top: 0, left: 0 }}
            />
          ))}
          <div className="absolute size-20 rounded-full flex items-center justify-center z-10"
            style={{ background: "linear-gradient(135deg,#007A8B,#3AAF4D)", boxShadow: "0 8px 32px rgba(0,122,139,0.4)" }}>
            <SpeedometerSVG />
          </div>
        </div>
      )}

      {/* Scanning hint */}
      {radarVisible && phase === "scanning" && (
        <p className="text-[#8B8C8E] text-[18px]" style={{ fontFamily: SF }}>Listening for nearby devices…</p>
      )}

      {/* Heading + grid — appear when devices found */}
      <div ref={gridRef} className="w-full" style={{ opacity: devices.length === 0 ? 0 : 1 }}>
        {/* Heading above list */}
        <h2 className="text-center font-semibold mb-5 leading-tight"
          style={{ fontSize: 36, letterSpacing: "-0.02em", color: "rgba(0,0,0,0.60)", fontFamily: SF }}>
          Let's find your spirometer.
        </h2>

        {/* Horizontal scrollable device grid */}
        <div
          className="w-full overflow-x-auto gf-no-scroll"
          style={{ paddingBottom: 12, paddingLeft: 14, paddingRight: 14, marginLeft: -14, marginRight: -14, width: "calc(100% + 28px)" }}
        >
          <div className="flex flex-row gap-4" style={{ minWidth: "max-content" }}>
            {devices.map(d => {
              const isSelected = selected === d.serial;
              const isConnecting = connecting === d.serial;
              return (
                <div
                  key={d.serial}
                  data-device-card={d.serial}
                  className={`gf-capsule flex flex-col items-center gap-3 p-5 cursor-pointer ${isSelected ? "gf-capsule-selected" : ""}`}
                  style={{ width: 210, minHeight: 240, borderRadius: 28, flexShrink: 0, justifyContent: "space-between" }}
                >
                  {/* Device icon */}
                  <div className="size-16 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: isSelected ? "rgba(255,255,255,0.2)" : "rgba(0,122,139,0.08)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke={isSelected ? "white" : "#007A8B"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <p className="text-[17px] font-semibold text-center leading-tight"
                      style={{ fontFamily: SF, color: isSelected ? "white" : "#434343" }}>{d.name}</p>
                    <p className="text-[13px] text-center"
                      style={{ fontFamily: SF, color: isSelected ? "rgba(255,255,255,0.75)" : "#8B8C8E" }}>{d.serial}</p>
                  </div>

                  {/* Signal */}
                  <SignalBars strength={d.signal} active={isSelected} />

                  {/* Connect / Status */}
                  {isSelected ? (
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.3)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-white text-[14px] font-semibold" style={{ fontFamily: SF }}>Connected</span>
                    </div>
                  ) : isConnecting ? (
                    <div className="size-7 rounded-full border-2 border-[#007A8B] border-t-transparent animate-spin" />
                  ) : (
                    <button
                      onClick={() => handleConnect(d)}
                      className="px-5 h-10 rounded-full text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: GRADIENT, fontFamily: SF, minWidth: 100 }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rescan */}
        {phase === "found" && !selected && (
          <button onClick={rescan} className="text-[#007A8B] text-[15px] hover:underline mt-3 block mx-auto" style={{ fontFamily: SF }}>
            Scan again
          </button>
        )}
      </div>
    </div>
  );
}
