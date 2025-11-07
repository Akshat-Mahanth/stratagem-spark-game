import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

interface PercentageSliderProps {
  label: string;
  segments: {
    name: string;
    value: number;
    color: string;
  }[];
  onChange: (segments: { name: string; value: number }[]) => void;
}

const PercentageSlider = ({ label, segments, onChange }: PercentageSliderProps) => {
  const [activeSegment, setActiveSegment] = useState(0);
  const [sliderValues, setSliderValues] = useState<number[]>([]);

  useEffect(() => {
    // Convert segments to cumulative values for the sliders
    const cumulative: number[] = [];
    let sum = 0;
    for (let i = 0; i < segments.length - 1; i++) {
      sum += segments[i].value;
      cumulative.push(sum);
    }
    setSliderValues(cumulative);
  }, [segments]);

  const handleSliderChange = (index: number, newValues: number[]) => {
    const newCumulative = [...sliderValues];
    newCumulative[index] = newValues[0];

    // Ensure sliders don't cross each other
    for (let i = 0; i < newCumulative.length - 1; i++) {
      if (newCumulative[i] > newCumulative[i + 1]) {
        newCumulative[i + 1] = newCumulative[i];
      }
    }
    for (let i = newCumulative.length - 1; i > 0; i--) {
      if (newCumulative[i] < newCumulative[i - 1]) {
        newCumulative[i - 1] = newCumulative[i];
      }
    }

    setSliderValues(newCumulative);

    // Convert cumulative back to individual percentages
    const newSegments = segments.map((seg, i) => {
      let value: number;
      if (i === 0) {
        value = newCumulative[0] || 0;
      } else if (i === segments.length - 1) {
        value = 100 - (newCumulative[newCumulative.length - 1] || 0);
      } else {
        value = (newCumulative[i] || 0) - (newCumulative[i - 1] || 0);
      }
      return { name: seg.name, value: Math.round(value) };
    });

    onChange(newSegments);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {/* Visual representation */}
      <div className="relative h-12 rounded-lg overflow-hidden border-2 border-primary/20 shadow-md">
        {segments.map((segment, idx) => (
          <div
            key={segment.name}
            className={`absolute h-full transition-all duration-200 flex items-center justify-center text-sm font-semibold cursor-pointer hover:brightness-110`}
            style={{
              left: `${idx === 0 ? 0 : sliderValues[idx - 1] || 0}%`,
              width: `${segment.value}%`,
              backgroundColor: segment.color,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
            onClick={() => setActiveSegment(idx)}
          >
            {segment.value > 8 && (
              <span className="select-none">{segment.name}: {segment.value}%</span>
            )}
          </div>
        ))}
      </div>

      {/* Sliders for each boundary */}
      <div className="space-y-3">
        {sliderValues.map((_, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{segments[idx].name} / {segments[idx + 1].name} boundary</span>
              <span>{sliderValues[idx]}%</span>
            </div>
            <Slider
              value={[sliderValues[idx]]}
              onValueChange={(newValues) => handleSliderChange(idx, newValues)}
              min={idx === 0 ? 0 : sliderValues[idx - 1]}
              max={idx === sliderValues.length - 1 ? 100 : 100}
              step={1}
              className="cursor-pointer"
            />
          </div>
        ))}
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

export default PercentageSlider;
