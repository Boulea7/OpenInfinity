import { useEffect, useState, useRef } from 'react';
import { generateTextIcon } from '../utils/iconGenerator';
import type { IconDraft } from '../types/iconDraft';
import { GlassInput } from './UI/GlassComponents';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

interface Props {
  onIconChange: (data: IconDraft | null) => void;
  websiteName?: string;
}

export default function TextIconEditor({ onIconChange, websiteName }: Props) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(64);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const generationIdRef = useRef(0);

  useEffect(() => {
    if (websiteName && !text) { // Only auto-fill if text is empty to avoid overwriting user edits
      const extracted = websiteName.slice(0, 2);
      setText(extracted);
    } else if (websiteName === '' && !text) {
      setText('');
    }
  }, [websiteName, text]);

  useEffect(() => {
    if (!text) {
      onIconChange(null);
      return;
    }

    const currentId = ++generationIdRef.current;
    let cancelled = false;

    generateTextIcon({ text, color, fontSize })
      .then((dataUrl) => {
        if (cancelled) return;
        if (currentId === generationIdRef.current) {
          onIconChange({
            type: 'text',
            value: text,
            color,
            dataUrl,
          });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to generate text icon:', error);
        if (currentId === generationIdRef.current) {
          onIconChange(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [text, fontSize, color, onIconChange]);

  return (
    <div className="space-y-4">
      <GlassInput
        label="显示文字"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 2))}
        placeholder="1-2个字符"
        maxLength={2}
        fullWidth
        className="text-center text-lg font-bold tracking-widest uppercase"
      />

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">
          字体大小: {fontSize}px
        </label>
        <input
          type="range"
          min="40"
          max="96"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-orange-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">背景颜色</label>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`
                flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all duration-200
                ${color === c ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent hover:scale-110'}
              `}
              style={{ backgroundColor: c }}
            />
          ))}
          <label
            className={`
              flex-shrink-0 w-8 h-8 rounded-full cursor-pointer border-2 transition-all duration-200 relative overflow-hidden flex items-center justify-center
              ${!PRESET_COLORS.includes(color) ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-zinc-700 hover:border-zinc-500'}
            `}
            style={{
              background: 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
            }}
            title="自定义颜色"
          >
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer p-0 border-0"
            />
            {/* Plus icon overlay for clarity */}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </label>
        </div>
      </div>
    </div>
  );
}

