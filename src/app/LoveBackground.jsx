import { useEffect, useMemo, useRef, useState } from "react";
import { Heart } from "lucide-react";

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getProfile = (w) => {
  // Predictable breakpoints (tweak if you want)
  if (w < 480) {
    return { tickMs: 520, frontProb: 0.55, backProb: 0.25, maxFront: 10, maxBack: 6 };
  }
  if (w < 768) {
    return { tickMs: 450, frontProb: 0.6, backProb: 0.3, maxFront: 14, maxBack: 8 };
  }
  if (w < 1024) {
    return { tickMs: 400, frontProb: 0.65, backProb: 0.35, maxFront: 18, maxBack: 10 };
  }
  return { tickMs: 360, frontProb: 0.7, backProb: 0.4, maxFront: 24, maxBack: 14 };
};

const LoveBackground = () => {
  const [hearts, setHearts] = useState([]);
  const icons = useMemo(() => [Heart], []);

  // profile is stored in a ref so the interval always reads latest values
  const profileRef = useRef(
    typeof window === "undefined" ? getProfile(1024) : getProfile(window.innerWidth),
  );

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReduced) return;

    // Update only when breakpoint changes (not every tiny mobile resize)
    const update = () => {
      profileRef.current = getProfile(window.innerWidth);
    };

    update();

    const mq1 = window.matchMedia("(max-width: 479px)");
    const mq2 = window.matchMedia("(min-width: 480px) and (max-width: 767px)");
    const mq3 = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const mq4 = window.matchMedia("(min-width: 1024px)");

    const onChange = () => update();

    mq1.addEventListener?.("change", onChange);
    mq2.addEventListener?.("change", onChange);
    mq3.addEventListener?.("change", onChange);
    mq4.addEventListener?.("change", onChange);

    return () => {
      mq1.removeEventListener?.("change", onChange);
      mq2.removeEventListener?.("change", onChange);
      mq3.removeEventListener?.("change", onChange);
      mq4.removeEventListener?.("change", onChange);
    };
  }, []);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReduced) return;

    const spawn = (layer) => {
      const id =
        globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());

      const isBack = layer === "back";

      setHearts((prev) => {
        const { maxFront, maxBack } = profileRef.current;

        const frontCount = prev.reduce((acc, h) => acc + (h.layer === "front" ? 1 : 0), 0);
        const backCount = prev.reduce((acc, h) => acc + (h.layer === "back" ? 1 : 0), 0);

        if (!isBack && frontCount >= maxFront) return prev;
        if (isBack && backCount >= maxBack) return prev;

        const size = isBack ? rand(18, 40) : rand(12, 28);
        const duration = isBack ? rand(10, 18) : rand(7, 13);
        const left = rand(0, 100);

        const drift = rand(-90, 90);
        const sway = rand(14, 40);
        const swaySpeed = rand(1.4, 2.8);
        const rotate = rand(-35, 35);

        // ✅ visible at bottom first, then starts moving
        const startDelay = isBack ? rand(0.5, 2.8) : rand(0.3, 2.1);

        const opacity = isBack ? rand(0.1, 0.22) : rand(0.18, 0.4);
        const blurPx = isBack ? rand(0.6, 1.6) : rand(0, 0.8);

        const Icon = pick(icons);

        // remove after animation finishes
        setTimeout(() => {
          setHearts((p) => p.filter((x) => x.id !== id));
        }, (duration + startDelay) * 1000 + 150);

        return [
          ...prev,
          {
            id,
            left,
            size,
            duration,
            opacity,
            layer,
            Icon,
            drift,
            sway,
            swaySpeed,
            rotate,
            startDelay,
            blurPx,
          },
        ];
      });
    };

    // ✅ ONE interval: stable tick loop
    let timer = null;

    const tick = () => {
      const { frontProb, backProb } = profileRef.current;

      if (Math.random() < frontProb) spawn("front");
      if (Math.random() < backProb) spawn("back");
    };

    const start = () => {
      // setInterval delay is fixed; we keep it stable and adjust probabilities via profile
      timer = setInterval(tick, 360); // base tick (steady)
    };

    start();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [icons]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {hearts.map((h) => (
        <span
          key={h.id}
          className={[
            "absolute will-change-transform",
            h.layer === "back"
              ? "animate-heart-float-back"
              : "animate-heart-float-front",
          ].join(" ")}
          style={{
            left: `${h.left}%`,
            bottom: "2vh",
            transform: "translateX(-50%) translateY(0)",
            opacity: h.opacity,
            filter: `blur(${h.blurPx}px)`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.startDelay}s`,
            "--drift": `${h.drift}px`,
            "--sway": `${h.sway}px`,
            "--rot": `${h.rotate}deg`,
            "--swaySpeed": `${h.swaySpeed}s`,
          }}
        >
          <h.Icon size={h.size} className="text-white drop-shadow" />
        </span>
      ))}
    </div>
  );
};

export default LoveBackground;
