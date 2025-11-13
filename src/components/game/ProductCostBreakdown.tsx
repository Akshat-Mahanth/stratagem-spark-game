import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingDown } from "lucide-react";

interface ProductCostBreakdownProps {
  rndBudget: number;
  productionMix: {
    luxury_percentage: number;
    flagship_percentage: number;
    midtier_percentage: number;
    lowertier_percentage: number;
  };
}

const ProductCostBreakdown = ({ rndBudget, productionMix }: ProductCostBreakdownProps) => {
  const formatIndianNumber = (value: number) => {
    return value.toLocaleString('en-IN');
  };

  const baseCosts = {
    luxury: 80000,
    flagship: 35000,
    midtier: 15000,
    lowertier: 6000
  };

  // R&D reduces costs by up to 30%
  const rndReduction = Math.min(0.3, (rndBudget / 5000000) * 0.3);
  const rndReductionPercent = (rndReduction * 100).toFixed(1);

  const actualCosts = {
    luxury: Math.round(baseCosts.luxury * (1 - rndReduction)),
    flagship: Math.round(baseCosts.flagship * (1 - rndReduction)),
    midtier: Math.round(baseCosts.midtier * (1 - rndReduction)),
    lowertier: Math.round(baseCosts.lowertier * (1 - rndReduction))
  };

  const weightedCost = 
    (actualCosts.luxury * productionMix.luxury_percentage / 100) +
    (actualCosts.flagship * productionMix.flagship_percentage / 100) +
    (actualCosts.midtier * productionMix.midtier_percentage / 100) +
    (actualCosts.lowertier * productionMix.lowertier_percentage / 100);

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
          <Package className="h-5 w-5" />
          Production Cost Per Unit
        </CardTitle>
        {rndReduction > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
            <TrendingDown className="h-4 w-4" />
            R&D Savings: {rndReductionPercent}%
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Luxury */}
          <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg p-3 text-white shadow-lg">
            <div className="text-xs font-semibold opacity-90">Luxury</div>
            <div className="text-2xl font-bold">₹{formatIndianNumber(actualCosts.luxury)}</div>
            {rndReduction > 0 && (
              <div className="text-xs line-through opacity-75">₹{formatIndianNumber(baseCosts.luxury)}</div>
            )}
            <div className="text-xs mt-1 font-medium">{productionMix.luxury_percentage}% of mix</div>
          </div>

          {/* Flagship */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-3 text-white shadow-lg">
            <div className="text-xs font-semibold opacity-90">Flagship</div>
            <div className="text-2xl font-bold">₹{formatIndianNumber(actualCosts.flagship)}</div>
            {rndReduction > 0 && (
              <div className="text-xs line-through opacity-75">₹{formatIndianNumber(baseCosts.flagship)}</div>
            )}
            <div className="text-xs mt-1 font-medium">{productionMix.flagship_percentage}% of mix</div>
          </div>

          {/* Mid-tier */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-3 text-white shadow-lg">
            <div className="text-xs font-semibold opacity-90">Mid-tier</div>
            <div className="text-2xl font-bold">₹{formatIndianNumber(actualCosts.midtier)}</div>
            {rndReduction > 0 && (
              <div className="text-xs line-through opacity-75">₹{formatIndianNumber(baseCosts.midtier)}</div>
            )}
            <div className="text-xs mt-1 font-medium">{productionMix.midtier_percentage}% of mix</div>
          </div>

          {/* Lower-tier */}
          <div className="bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg p-3 text-white shadow-lg">
            <div className="text-xs font-semibold opacity-90">Lower-tier</div>
            <div className="text-2xl font-bold">₹{formatIndianNumber(actualCosts.lowertier)}</div>
            {rndReduction > 0 && (
              <div className="text-xs line-through opacity-75">₹{formatIndianNumber(baseCosts.lowertier)}</div>
            )}
            <div className="text-xs mt-1 font-medium">{productionMix.lowertier_percentage}% of mix</div>
          </div>
        </div>

        {/* Weighted Average */}
        <div className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-white shadow-xl">
          <div className="text-sm font-semibold opacity-90">Weighted Average Cost Per Unit</div>
          <div className="text-3xl font-bold">₹{formatIndianNumber(Math.round(weightedCost))}</div>
          <div className="text-xs mt-1 opacity-90">
            Based on your current production mix
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCostBreakdown;
