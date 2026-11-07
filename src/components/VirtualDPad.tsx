import React, { useRef, useState } from 'react';
import { Compass } from 'lucide-react';

interface VirtualDPadProps {
  onAngleChange: (angle: number | null) => void;
  headAngle: number;
}

export const VirtualDPad: React.FC<VirtualDPadProps> = ({
  onAngleChange,
  headAngle,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsActive(true);
    updateAngleFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    e.preventDefault();
    updateAngleFromEvent(e);
  };

  const handlePointerUp = () => {
    setIsActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onAngleChange(null);
  };

  const updateAngleFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      const angle = Math.atan2(dy, dx);
      onAngleChange(angle);

      // Clamp knob movement to radius
      const maxR = rect.width / 2 - 18;
      const r = Math.min(dist, maxR);
      setKnobOffset({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
  };

  // Convert head angle to visual degrees
  const headDeg = Math.round((headAngle * 180) / Math.PI);

  return (
    <div className="flex flex-col items-center justify-center p-2 select-none touch-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-28 h-28 rounded-full border flex items-center justify-center cursor-pointer transition-colors shadow-lg ${
          isActive
            ? 'bg-slate-900 border-emerald-500/80 shadow-emerald-950/40'
            : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
        }`}
      >
        {/* Cardinal tick marks */}
        <div className="absolute top-1.5 w-1 h-2 bg-slate-600 rounded-full" />
        <div className="absolute bottom-1.5 w-1 h-2 bg-slate-600 rounded-full" />
        <div className="absolute left-1.5 h-1 w-2 bg-slate-600 rounded-full" />
        <div className="absolute right-1.5 h-1 w-2 bg-slate-600 rounded-full" />

        {/* Outer Ring Accent */}
        <div
          className="absolute inset-1.5 rounded-full border border-dashed border-slate-700/60 pointer-events-none"
          style={{ transform: `rotate(${headDeg}deg)` }}
        />

        {/* Center Joystick Knob */}
        <div
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-transform pointer-events-none ${
            isActive
              ? 'bg-emerald-600 border-emerald-300 text-white shadow-md shadow-emerald-900/60'
              : 'bg-slate-800 border-slate-600 text-slate-300'
          }`}
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        >
          <Compass className="w-5 h-5" />
        </div>
      </div>
      <span className="text-[11px] text-slate-500 font-medium mt-1.5">
        360° 觸控方向盤
      </span>
    </div>
  );
};
