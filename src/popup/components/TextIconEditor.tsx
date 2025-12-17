import { useEffect, useState, useRef } from 'react';
import { generateTextIcon } from '../utils/iconGenerator';
import type { IconDraft } from '../types/iconDraft';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

interface Props {
  onIconChange: (iconData: IconDraft | null) => void;
  websiteName?: string;  // Website name for syncing
}

export default function TextIconEditor({ onIconChange, websiteName }: Props) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(64);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const generationIdRef = useRef(0);

  // Auto-sync with website name (real-time sync)
  useEffect(() => {
    if (websiteName) {
      const extracted = websiteName.slice(0, 2);  // Support Chinese, English, lowercase
      setText(extracted);  // Always sync
    } else if (websiteName === '') {
      setText('');  // Clear when website name is empty
    }
  }, [websiteName]);

  useEffect(() => {
    // Clear icon when text is empty
    if (!text) {
      onIconChange(null);
      return;
    }

    // Increment generation ID to cancel previous operations
    const currentId = ++generationIdRef.current;
    let cancelled = false;

    generateTextIcon({ text, color, fontSize })
      .then((dataUrl) => {
        if (cancelled) return;
        // Only update if this is still the latest generation
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
      {/* Text input */}
      <div>
        <label className="block text-sm font-medium mb-1">显示文字</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2))}  // Allow lowercase and Chinese
          placeholder="输入1-2个字符"
          maxLength={2}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Font size slider */}
      <div>
        <label className="block text-sm font-medium mb-1">
          字体大小: {fontSize}px
        </label>
        <input
          type="range"
          min="40"
          max="96"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Color picker - Single row with rainbow palette */}
      <div>
        <label className="block text-sm font-medium mb-1">背景颜色</label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-10 h-10 rounded-full border-2 transition-all flex-shrink-0"
              style={{
                backgroundColor: c,
                borderColor: color === c ? '#000' : '#ccc',
              }}
            />
          ))}
          {/* Rainbow gradient palette */}
          <label
            className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 hover:border-gray-400 transition-colors flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
            }}
            title="自定义颜色"
          >
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
