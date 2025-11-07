import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuarterTimerProps {
  game: any;
}

const QuarterTimer = ({ game }: QuarterTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!game.quarter_start_time) return;

    const calculateTimeRemaining = () => {
      const startTime = new Date(game.quarter_start_time).getTime();
      const quarterDuration = game.quarter_duration_seconds * 1000;
      const endTime = startTime + quarterDuration;
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      setTimeRemaining(Math.floor(remaining / 1000));

      // Auto-advance when timer hits 0
      if (remaining === 0 && !isProcessing) {
        handleAutoAdvance();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [game.quarter_start_time, game.quarter_duration_seconds, isProcessing]);

  const handleAutoAdvance = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      toast.loading("Processing quarter results...");

      // Call the edge function to calculate results
      const { error: calcError } = await supabase.functions.invoke(
        "calculate-quarter-results",
        {
          body: {
            gameId: game.id,
            quarter: game.current_quarter,
          },
        }
      );

      if (calcError) throw calcError;

      // Advance to next quarter
      const nextQuarter = game.current_quarter + 1;
      
      if (nextQuarter <= game.max_quarters) {
        await supabase
          .from("games")
          .update({
            current_quarter: nextQuarter,
            quarter_start_time: new Date().toISOString(),
          })
          .eq("id", game.id);

        toast.success(`Quarter ${game.current_quarter} complete! Starting Quarter ${nextQuarter}`);
      } else {
        // Game is over
        await supabase
          .from("games")
          .update({
            status: "completed",
          })
          .eq("id", game.id);

        toast.success("Game completed!");
      }
    } catch (error: any) {
      console.error("Error auto-advancing quarter:", error);
      toast.error("Failed to advance quarter automatically");
    } finally {
      setIsProcessing(false);
      toast.dismiss();
    }
  };

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
