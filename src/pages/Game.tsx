import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import GameDashboard from "@/components/game/GameDashboard";
import WaitingRoom from "@/components/game/WaitingRoom";

const Game = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("team");
  
  const [game, setGame] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    const fetchGameData = async () => {
      try {
        // Fetch game
        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .single();

        if (gameError) throw gameError;
        setGame(gameData);

        // Fetch team if teamId is provided
        if (teamId) {
          const { data: teamData, error: teamError } = await supabase
            .from("teams")
            .select("*")
            .eq("id", teamId)
            .single();

          if (teamError) throw teamError;
          setTeam(teamData);
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
        toast.error("Failed to load game");
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();

    // Set up realtime subscription
    const channel = supabase
      .channel("game-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          setGame(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Game not found</h2>
          <p className="text-muted-foreground">The game you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (game.status === "waiting") {
    return <WaitingRoom game={game} team={team} />;
  }

  return <GameDashboard game={game} team={team} />;
};

export default Game;
