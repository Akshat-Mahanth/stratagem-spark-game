import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import GameDashboard from "@/components/game/GameDashboard";
import WaitingRoom from "@/components/game/WaitingRoom";
import WinScreen from "@/components/game/WinScreen";
import ConnectionStatus from "@/components/ui/ConnectionStatus";

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

    // Set up realtime subscriptions with retry logic
    const gameChannel = supabase
      .channel(`game-updates-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log("Game update received:", payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setGame(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log("Game subscription status:", status);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error("Game subscription failed, retrying...");
          setTimeout(() => {
            fetchGameData();
          }, 2000);
        }
      });

    // Subscribe to team updates if we have a team
    let teamChannel: any = null;
    if (teamId) {
      teamChannel = supabase
        .channel(`team-updates-${teamId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "teams",
            filter: `id=eq.${teamId}`,
          },
          (payload) => {
            console.log("Team update received:", payload);
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              setTeam(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log("Team subscription status:", status);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error("Team subscription failed, retrying...");
            setTimeout(() => {
              fetchGameData();
            }, 2000);
          }
        });
    }

    return () => {
      supabase.removeChannel(gameChannel);
      if (teamChannel) {
        supabase.removeChannel(teamChannel);
      }
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
    return (
      <>
        <ConnectionStatus />
        <WaitingRoom game={game} team={team} />
      </>
    );
  }

  // Show win screen when game is completed
  if (game.status === "completed") {
    return (
      <>
        <ConnectionStatus />
        <WinScreen game={game} team={team} />
      </>
    );
  }

  // Host view when no team
  if (!team) {
    const HostDashboard = lazy(() => import("@/components/game/HostDashboard"));
    return (
      <>
        <ConnectionStatus />
        <Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        }>
          <HostDashboard game={game} />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <ConnectionStatus />
      <GameDashboard game={game} team={team} />
    </>
  );
};

export default Game;
