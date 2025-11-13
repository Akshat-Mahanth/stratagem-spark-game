import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface IntuitiveTierSliderProps {
  label: string;
  segments: {
    name: string;
    value: number;
    color: string;
  }[];
  onChange: (segments: { name: string; value: number }[]) => void;
}

const IntuitiveTierSlider = ({ label, segments, onChange }: IntuitiveTierSliderProps) => {
  const [values, setValues] = useState<number[]>([]);
  const [inputMode, setInputMode] = useState(false);

  useEffect(() => {
    setValues(segments.map(seg => seg.value));
  }, [segments]);

  const handleSliderChange = (index: number, newValue: number) => {
    const newValues = [...values];
    const oldValue = newValues[index];
    const difference = newValue - oldValue;
    
    newValues[index] = newValue;

    // Distribute the difference among other segments proportionally
    const otherIndices = newValues.map((_, i) => i).filter(i => i !== index);
    const otherTotal = otherIndices.reduce((sum, i) => sum + newValues[i], 0);
    
    if (otherTotal > 0 && difference !== 0) {
      otherIndices.forEach(i => {
        const proportion = newValues[i] / otherTotal;
        const adjustment = proportion * difference;
        newValues[i] = Math.max(0, Math.round(newValues[i] - adjustment));
      });
    }

    // Ensure total is exactly 100
    const currentTotal = newValues.reduce((sum, val) => sum + val, 0);
    if (currentTotal !== 100) {
      const adjustment = 100 - currentTotal;
      // Apply adjustment to the largest non-changed segment
      let maxIndex = otherIndices[0] || 0;
      let maxValue = newValues[maxIndex];
      otherIndices.forEach(i => {
        if (newValues[i] > maxValue) {
          maxValue = newValues[i];
          maxIndex = i;
        }
      });
      newValues[maxIndex] = Math.max(0, newValues[maxIndex] + adjustment);
    }

    setValues(newValues);
    updateSegments(newValues);
  };

  const handleInputChange = (index: number, newValue: number) => {
    const newValues = [...values];
    newValues[index] = Math.max(0, Math.min(100, newValue));
    
    // Auto-adjust others to maintain 100% total
    const currentTotal = newValues.reduce((sum, val) => sum + val, 0);
    if (currentTotal > 100) {
      const excess = currentTotal - 100;
      const otherIndices = newValues.map((_, i) => i).filter(i => i !== index);
      const otherTotal = otherIndices.reduce((sum, i) => sum + newValues[i], 0);
      
      if (otherTotal > 0) {
        otherIndices.forEach(i => {
          const proportion = newValues[i] / otherTotal;
          const reduction = proportion * excess;
          newValues[i] = Math.max(0, Math.round(newValues[i] - reduction));
        });
      }
    }

    setValues(newValues);
    updateSegments(newValues);
  };

  const updateSegments = (newValues: number[]) => {
    const newSegments = segments.map((seg, i) => ({
      name: seg.name,
      value: Math.max(0, newValues[i] || 0)
    }));
    onChange(newSegments);
  };

  const total = values.reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setInputMode(!inputMode)}
          className="text-xs text-primary hover:underline"
        >
          {inputMode ? 'Switch to Sliders' : 'Switch to Input'}
        </button>
      </div>
      
      {/* Visual representation */}
      <div className="relative h-16 rounded-lg overflow-hidden border-2 border-primary/20 shadow-md bg-gray-100">
        {segments.map((segment, idx) => {
          const leftPosition = segments.slice(0, idx).reduce((sum, seg) => sum + seg.value, 0);
          return (
            <div
              key={segment.name}
              className="absolute h-full transition-all duration-300 flex flex-col items-center justify-center text-xs font-semibold cursor-pointer hover:brightness-110"
              style={{
                left: `${leftPosition}%`,
                width: `${segment.value}%`,
                backgroundColor: segment.color,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}
              onClick={() => setInputMode(!inputMode)}
            >
              {segment.value > 5 && (
                <>
                  <span className="select-none">{segment.name}</span>
                  <span className="select-none text-xs font-bold">{segment.value}%</span>
                </>
              )}
            </div>
          );
        })}
        
        {/* Grid lines for better visual reference */}
        {[25, 50, 75].map(position => (
          <div
            key={position}
            className="absolute top-0 bottom-0 w-px bg-white/30"
            style={{ left: `${position}%` }}
          />
        ))}
      </div>

      {/* Controls */}
      {inputMode ? (
        // Input mode
        <div className="grid grid-cols-2 gap-3">
          {segments.map((segment, idx) => (
            <div key={segment.name} className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="font-medium">{segment.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={values[idx] || 0}
                  onChange={(e) => handleInputChange(idx, Number(e.target.value))}
                  min={0}
                  max={100}
                  className="h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Slider mode
        <div className="space-y-3">
          {segments.map((segment, idx) => (
            <div key={segment.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: segment.color }}
                  />
                  {segment.name}
                </span>
                <span className="font-bold text-primary">{values[idx] || 0}%</span>
              </div>
              <Slider
                value={[values[idx] || 0]}
                onValueChange={(newValues) => handleSliderChange(idx, newValues[0])}
                min={0}
                max={100}
                step={1}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total validation with better visual feedback */}
      <div className={`p-3 rounded-lg border-2 text-center font-bold ${
        total === 100 
          ? 'bg-green-50 border-green-200 text-green-700' 
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        Total: {total}% {total !== 100 && '⚠️ Must equal 100%'}
      </div>

      {/* Quick preset buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            const evenSplit = [25, 25, 25, 25];
            setValues(evenSplit);
            updateSegments(evenSplit);
          }}
          className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
        >
          Even Split
        </button>
        <button
          type="button"
          onClick={() => {
            const premiumFocus = [40, 35, 20, 5];
            setValues(premiumFocus);
            updateSegments(premiumFocus);
          }}
          className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
        >
          Premium Focus
        </button>
        <button
          type="button"
          onClick={() => {
            const massMarket = [5, 20, 35, 40];
            setValues(massMarket);
            updateSegments(massMarket);
          }}
          className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
        >
          Mass Market
        </button>
      </div>
    </div>
  );
};

export default IntuitiveTierSlider;
