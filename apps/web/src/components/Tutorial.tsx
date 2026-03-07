import { useState, useEffect, useRef, useCallback } from "react";

interface TutorialStep {
  title: string;
  /** CSS selector for the element to spotlight, or null for no spotlight */
  selector: string | null;
}

const STEPS: TutorialStep[] = [
  {
    title:
      "Welcome to Hegemon! You've just founded your nation. Let's get you started.",
    selector: null,
  },
  {
    title:
      "These are your resources. Cash, Materials, and Food are produced by buildings every 10 minutes.",
    selector: "[data-tutorial='resource-bar']",
  },
  {
    title: "Head to Nation to build and upgrade your infrastructure.",
    selector: "[data-tutorial='nav-nation']",
  },
  {
    title: "Train troops in the Military tab to attack other players.",
    selector: "[data-tutorial='nav-military']",
  },
  {
    title: "Use Cyber Ops for espionage and sabotage.",
    selector: "[data-tutorial='nav-cyber']",
  },
  {
    title: "Trade resources on the Market with other players.",
    selector: "[data-tutorial='nav-market']",
  },
  {
    title: "Join or create an Alliance to team up with other players.",
    selector: "[data-tutorial='nav-alliance']",
  },
  {
    title:
      "Check the Help page anytime you need guidance. Good luck, Commander!",
    selector: "[data-tutorial='nav-help']",
  },
];

const LS_KEY = "hegemon_tutorial_complete";

export default function Tutorial() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const done = localStorage.getItem(LS_KEY);
    if (!done) {
      setVisible(true);
    }
  }, []);

  const updateSpotlight = useCallback(() => {
    const sel = STEPS[step]?.selector;
    if (!sel) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(sel);
    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      setSpotlightRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    updateSpotlight();
    // Re-measure on resize / scroll
    function onLayout() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateSpotlight);
    }
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible, step, updateSpotlight]);

  function dismiss() {
    localStorage.setItem(LS_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const pad = 6;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with spotlight cutout */}
      {spotlightRect ? (
        <div
          className="absolute rounded-lg"
          style={{
            top: spotlightRect.top - pad,
            left: spotlightRect.left - pad,
            width: spotlightRect.width + pad * 2,
            height: spotlightRect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Tooltip card */}
      <div
        className="absolute z-10 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-5 w-[340px] max-w-[90vw]"
        style={spotlightRect ? {
          top: Math.min(
            spotlightRect.bottom + pad + 12,
            window.innerHeight - 200,
          ),
          left: Math.max(
            8,
            Math.min(
              spotlightRect.left,
              window.innerWidth - 360,
            ),
          ),
        } : {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <p className="text-sm text-gray-200 leading-relaxed mb-4">
          {current.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 tabular-nums">
            {step + 1}/{STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1"
            >
              Skip Tutorial
            </button>
            <button
              onClick={next}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              {step < STEPS.length - 1 ? "Next" : "Finish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
