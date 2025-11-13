import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

interface FourTierSliderProps {
  label: string;
  segments: {
    name: string;
    value: number;
    color: string;
  }[];
  onChange: (segments: { name: string; value: number }[]) => void;
}

const FourTierSlider = ({ label, segments, onChange }: FourTierSliderProps) => {
  const [values, setValues] = useState<number[]>([]);

  useEffect(() => {
    setValues(segments.map(seg => seg.value));
  }, [segments]);

  const handleSliderChange = (index: number, newValue: number) => {
    const newValues = [...values];
    newValues[index] = newValue;

    // Ensure total doesn't exceed 100
    const total = newValues.reduce((sum, val) => sum + val, 0);
    if (total > 100) {
      // Proportionally reduce other values
      const excess = total - 100;
      const otherTotal = newValues.reduce((sum, val, i) => i === index ? sum : sum + val, 0);
      
      if (otherTotal > 0) {
        for (let i = 0; i < newValues.length; i++) {
          if (i !== index) {
            const reduction = (newValues[i] / otherTotal) * excess;
            newValues[i] = Math.max(0, Math.round(newValues[i] - reduction));
          }
        }
      }
    }

    // Ensure all values are non-negative and sum to 100
    const finalTotal = newValues.reduce((sum, val) => sum + val, 0);
    if (finalTotal !== 100) {
      const diff = 100 - finalTotal;
      // Add/subtract the difference to the largest value (excluding the one being changed)
      let maxIndex = 0;
      let maxValue = -1;
      for (let i = 0; i < newValues.length; i++) {
        if (i !== index && newValues[i] > maxValue) {
          maxValue = newValues[i];
          maxIndex = i;
        }
      }
      newValues[maxIndex] = Math.max(0, newValues[maxIndex] + diff);
    }

    setValues(newValues);

    // Convert back to segments format
    const newSegments = segments.map((seg, i) => ({
      name: seg.name,
      value: Math.max(0, newValues[i] || 0)
    }));

    onChange(newSegments);
  };

  const total = values.reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {/* Visual representation */}
      <div className="relative h-12 rounded-lg overflow-hidden border-2 border-primary/20 shadow-md">
        {segments.map((segment, idx) => {
          const leftPosition = segments.slice(0, idx).reduce((sum, seg) => sum + seg.value, 0);
          return (
            <div
              key={segment.name}
              className="absolute h-full transition-all duration-200 flex items-center justify-center text-sm font-semibold"
              style={{
                left: `${leftPosition}%`,
                width: `${segment.value}%`,
                backgroundColor: segment.color,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {segment.value > 8 && (
                <span className="select-none">{segment.name}: {segment.value}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Individual sliders for each tier */}
      <div className="space-y-3">
        {segments.map((segment, idx) => (
          <div key={segment.name} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.name}
              </span>
              <span>{values[idx] || 0}%</span>
            </div>
            <Slider
              value={[values[idx] || 0]}
              onValueChange={(newValues) => handleSliderChange(idx, newValues[0])}
              min={0}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Total validation */}
      <div className={`text-sm font-medium ${total === 100 ? 'text-green-600' : 'text-red-600'}`}>
        Total: {total}% {total !== 100 && '(Must equal 100%)'}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 pt-2">
        {segments.map((segment) => (
          <div key={segment.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: segment.color }}
            />
            <span className="font-medium">{segment.name}:</span>
            <span className="text-muted-foreground">{segment.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FourTierSlider;
