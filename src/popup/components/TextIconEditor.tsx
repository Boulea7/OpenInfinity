import { useEffect, useState, useRef } from 'react';
import { generateTextIcon } from '../utils/iconGenerator';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

interface Props {
  onIconChange: (iconData: any) => void;
}

export default function TextIconEditor({ onIconChange }: Props) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(64);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const generationIdRef = useRef(0);

  useEffect(() => {
    // Clear icon when text is empty
    if (!text) {
      onIconChange(null);
      return;
    }

    // Increment generation ID to cancel previous operations
    const currentId = ++generationIdRef.current;

    generateTextIcon({ text, color, fontSize })
      .then((dataUrl) => {
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
        console.error('Failed to generate text icon:', error);
        if (currentId === generationIdRef.current) {
          onIconChange(null);
        }
      });
  }, [text, fontSize, color, onIconChange]);

  return (
    <div className="space-y-4">
      {/* Text input */}
      <div>
        <label className="block text-sm font-medium mb-1">显示文字</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2))}
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

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium mb-1">背景颜色</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-10 h-10 rounded-lg border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: color === c ? '#000' : '#ccc',
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
