import React from 'react';

const EQ_BANDS = [
  { freq: '32', color: 'from-blue-400 to-blue-600' },
  { freq: '64', color: 'from-cyan-400 to-cyan-600' },
  { freq: '125', color: 'from-green-400 to-green-600' },
  { freq: '250', color: 'from-lime-400 to-lime-600' },
  { freq: '500', color: 'from-yellow-400 to-yellow-600' },
  { freq: '1k', color: 'from-orange-400 to-orange-600' },
  { freq: '4k', color: 'from-pink-400 to-pink-600' },
  { freq: '8k', color: 'from-purple-400 to-purple-600' },
];

type EQSectionProps = {
  bands?: number[];
  onBandChange?: (index: number, value: number) => void;
  knobs?: number[];
  onKnobChange?: (index: number, value: number) => void;
  toggles?: boolean[];
  onToggle?: (index: number, checked: boolean) => void;
};

function Knob({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (value: number) => void; label: string }) {
  // value: 0-100
  const angle = ((value - min) / (max - min)) * 270 - 135;
  return (
    <div className="flex flex-col items-center">
      <svg width="56" height="56" viewBox="0 0 56 56" className="mb-1">
        <circle cx="28" cy="28" r="24" fill="#18181b" stroke="#333" strokeWidth="2" />
        <g transform={`rotate(${angle} 28 28)`}>
          <rect x="26.5" y="8" width="3" height="12" rx="1.5" fill="#fff" />
        </g>
      </svg>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-12 accent-pink-500"
      />
      <span className="text-xs text-gray-300 mt-1">{label}</span>
    </div>
  );
}

export default function EQSection({ bands = Array(8).fill(0), onBandChange = () => {}, knobs = [50, 50], onKnobChange = () => {}, toggles = [false], onToggle = () => {} }: EQSectionProps) {
  return (
    <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-md shadow-xl flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Dials */}
      <div className="flex justify-center gap-8 mb-4">
        <Knob value={knobs[0]} min={0} max={100} onChange={v => onKnobChange(0, v)} label="VOL" />
        <Knob value={knobs[1]} min={0} max={100} onChange={v => onKnobChange(1, v)} label="EQ" />
      </div>
      {/* EQ Sliders */}
      <div className="flex gap-3 justify-center items-end mb-4">
        {EQ_BANDS.map((band, i) => (
          <div key={band.freq} className="flex flex-col items-center">
            <input
              type="range"
              min={-12}
              max={12}
              value={bands[i]}
              onChange={e => onBandChange(i, Number(e.target.value))}
              className={`h-24 w-2 bg-gradient-to-t ${band.color} rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full`}
              style={{ writingMode: 'vertical-lr', WebkitAppearance: 'slider-vertical' } as React.CSSProperties}
            />
            <span className="text-xs text-gray-400 mt-1">{band.freq}</span>
          </div>
        ))}
      </div>
      {/* Bass Toggle - Centered */}
      <div className="flex justify-center mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-gray-300">Bass</span>
          <input type="checkbox" checked={toggles[0]} onChange={e => onToggle(0, e.target.checked)} className="accent-blue-500 w-5 h-5" />
        </label>
      </div>
    </div>
  );
} 