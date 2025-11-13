import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface SpeedometerChartProps {
  value: number;
  maxValue: number;
  title: string;
  unit?: string;
  color?: string;
  size?: number;
}

const SpeedometerChart = ({ 
  value, 
  maxValue, 
  title, 
  unit = "", 
  color = "#006747",
  size = 120 
}: SpeedometerChartProps) => {
  // Normalize value to 0-100 range
  const normalizedValue = Math.min(Math.max(value, 0), maxValue);
  const percentage = (normalizedValue / maxValue) * 100;
  
  // Create data for half-circle (180 degrees)
  const data = [
    { name: 'filled', value: percentage },
    { name: 'empty', value: 100 - percentage },
    { name: 'hidden', value: 100 } // This creates the bottom half to hide
  ];

  // Color scheme for different value ranges
  const getColor = (pct: number) => {
    if (pct >= 80) return "#FF1E00"; // Red for high values
    if (pct >= 60) return "#CEDC00"; // Yellow for medium-high
    if (pct >= 40) return "#00D2BE"; // Teal for medium
    return "#006747"; // Green for low values
  };

  const fillColor = color === "#006747" ? getColor(percentage) : color;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <ResponsiveContainer width="100%" height={size}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={size * 0.25}
              outerRadius={size * 0.4}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={fillColor} />
              <Cell fill="#E5E7EB" />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <div className="text-2xl font-bold text-gray-800">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </div>
          <div className="text-xs text-gray-500">{unit}</div>
        </div>

        {/* Scale markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
          <span>0</span>
          <span>{(maxValue / 2).toFixed(0)}</span>
          <span>{maxValue}</span>
        </div>
      </div>
      
      {/* Title */}
      <div className="text-sm font-medium text-center mt-2 text-gray-700">
        {title}
      </div>
    </div>
  );
};

export default SpeedometerChart;
