"use client";

import { useState } from "react";
import { LayoutTemplate, Monitor, Smartphone, Tablet, ChevronDown, Check } from "lucide-react";

const DESIGNS = [
  { id: "viicasa_architectural_precision", name: "Architectural Precision" },
  { id: "viicasa_editorial_minimalism", name: "Editorial Minimalism" },
  { id: "viicasa_immersive_luxury", name: "Immersive Luxury" },
  { id: "viicasa_immersive_luxury_visuals", name: "Immersive Luxury Visuals" },
  { id: "viicasa_something_exceptional_is_coming", name: "Exceptional is Coming" },
  { id: "viicasa_waitlist_landing_variations", name: "Waitlist Variations" },
];

const DEVICE_WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export default function DesignViewer() {
  const [activeDesign, setActiveDesign] = useState(DESIGNS[0].id);
  const [deviceSize, setDeviceSize] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-neutral-900 overflow-hidden font-sans">
      {/* Top Floating Menu bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        
        {/* Design Selector */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <LayoutTemplate size={16} />
            <span className="max-w-[150px] truncate">
              {DESIGNS.find((d) => d.id === activeDesign)?.name}
            </span>
            <ChevronDown size={14} className="text-neutral-400" />
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsMenuOpen(false)} 
              />
              <div className="absolute top-full mt-2 left-0 w-64 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                  {DESIGNS.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => {
                        setActiveDesign(design.id);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                        activeDesign === design.id
                          ? "bg-white/10 text-white"
                          : "text-neutral-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="truncate pr-2">{design.name}</span>
                      {activeDesign === design.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        {/* Device Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeviceSize("desktop")}
            className={`p-2 rounded-xl transition-colors ${
              deviceSize === "desktop" ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
            title="Desktop view"
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setDeviceSize("tablet")}
            className={`p-2 rounded-xl transition-colors ${
              deviceSize === "tablet" ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
            title="Tablet view"
          >
            <Tablet size={16} />
          </button>
          <button
            onClick={() => setDeviceSize("mobile")}
            className={`p-2 rounded-xl transition-colors ${
              deviceSize === "mobile" ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
            title="Mobile view"
          >
            <Smartphone size={16} />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 w-full bg-neutral-950 flex items-center justify-center pt-24 pb-8 px-4">
        <div
          className={`h-full relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white`}
          style={{ width: DEVICE_WIDTHS[deviceSize] }}
        >
          <iframe
            key={activeDesign}
            src={`${process.env.NODE_ENV === 'production' ? '/landing_viicasa_coming-soon' : ''}/designs/${activeDesign}/code.html`}
            className="w-full h-full border-none"
            title={`Preview of ${activeDesign}`}
          />
        </div>
      </div>
    </div>
  );
}
