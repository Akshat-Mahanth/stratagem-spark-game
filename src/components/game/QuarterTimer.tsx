import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface QuarterTimerProps {
  game: any;
}

const QuarterTimer = ({ game }: QuarterTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!game.quarter_start_time) return;

    const calculateTimeRemaining = () => {
      const startTime = new Date(game.quarter_start_time).getTime();
      const quarterDuration = game.quarter_duration_seconds * 1000;
      const endTime = startTime + quarterDuration;
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      setTimeRemaining(Math.floor(remaining / 1000));
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [game.quarter_start_time, game.quarter_duration_seconds]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <Card className="metric-card border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">Time Remaining</div>
            <div className="text-3xl font-bold font-mono text-neon-cyan">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuarterTimer;
