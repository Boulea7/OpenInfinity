import { GlassInput } from './UI/GlassComponents';

export const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

export interface TextIconConfig {
  text: string;
  color: string;
  fontSize: number;
  isManuallyEdited: boolean;
}

interface Props {
  config: TextIconConfig;
  onChange: (config: TextIconConfig) => void;
}

export default function TextIconEditor({ config, onChange }: Props) {
  const { text, fontSize, color } = config;

  const updateConfig = (updates: Partial<TextIconConfig>) => {
    onChange({ ...config, ...updates });
  };

  // Handle manual input
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({
      text: e.target.value.slice(0, 2),
      isManuallyEdited: true
    });
  };

  return (
    <div className="space-y-3">
      <GlassInput
        label="显示文字"
        type="text"
        value={text}
        onChange={handleTextChange}
        placeholder="1-2个字符"
        maxLength={2}
        fullWidth
        // Removed uppercase class to support mixed case inputs as requested
        className="text-center text-lg font-bold tracking-widest border-none bg-zinc-50 dark:bg-zinc-800 rounded-lg h-10"
      />

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-zinc-500 whitespace-nowrap">
          大小: {fontSize}px
        </label>
        <input
          type="range"
          min="40"
          max="200"
          value={fontSize}
          onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-orange-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">背景颜色</label>
        <div className="flex flex-wrap gap-2 justify-between">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateConfig({ color: c })}
              className={`
                flex-shrink-0 w-6 h-6 rounded-lg transition-all duration-200
                ${color === c
                  ? 'ring-2 ring-offset-1 ring-brand-orange-500 scale-105'
                  : 'hover:scale-105 ring-1 ring-black/5 dark:ring-white/10'}
              `}
              style={{ backgroundColor: c }}
            />
          ))}
          <label
            className={`
              flex-shrink-0 w-6 h-6 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden flex items-center justify-center
              ${!PRESET_COLORS.includes(color)
                ? 'ring-2 ring-offset-1 ring-brand-orange-500 scale-105'
                : 'ring-1 ring-zinc-200 hover:ring-zinc-400'}
            `}
            style={{
              background: 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
            }}
            title="自定义颜色"
          >
            <input
              type="color"
              value={color}
              onChange={(e) => updateConfig({ color: e.target.value })}
              className="absolute inset-0 opacity-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer p-0 border-0"
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </label>
        </div>
      </div>
    </div>
  );
}

