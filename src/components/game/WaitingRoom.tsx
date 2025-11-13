import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Users, PlayCircle } from "lucide-react";

interface WaitingRoomProps {
  game: any;
  team: any;
}

const WaitingRoom = ({ game, team }: WaitingRoomProps) => {
  const [teams, setTeams] = useState<any[]>([]);
  const isHost = !team;

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("game_id", game.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching teams:", error);
        return;
      }

      setTeams(data || []);
    };

    fetchTeams();

    // Subscribe to team changes
    const channel = supabase
      .channel(`teams-updates-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          console.log("Team update received:", payload);
          fetchTeams();
        }
      )
      .subscribe((status) => {
        console.log("Teams subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game.id]);

  const copyGameCode = () => {
    navigator.clipboard.writeText(game.game_code);
    toast.success("Game code copied!");
  };

  const startGame = async () => {
    if (teams.length < 2) {
      toast.error("Need at least 2 teams to start");
      return;
    }

    const { error } = await supabase
      .from("games")
      .update({
        status: "active",
        current_quarter: 1,
        quarter_start_time: new Date().toISOString(),
      })
      .eq("id", game.id);

    if (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    } else {
      toast.success("Game started!");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-neon-blue">
            Waiting for Players
          </h1>
          <p className="text-muted-foreground">
            {isHost ? "Share the game code with teams" : "Waiting for game to start..."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="strategic-gradient border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Game Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <div className="text-5xl font-bold font-mono tracking-wider text-neon-cyan">
                    {game.game_code}
                  </div>
                </div>
                <Button onClick={copyGameCode} variant="outline" size="icon">
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="strategic-gradient border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams ({teams.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teams.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between"
                  >
                    <span className="font-medium">{t.team_name}</span>
                    {t.id === team?.id && (
                      <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                        You
                      </span>
                    )}
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No teams joined yet...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {isHost && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={startGame}
              disabled={teams.length < 2}
              className="h-14 px-8 text-lg shadow-glow"
            >
              <PlayCircle className="mr-2 h-6 w-6" />
              Start Game
            </Button>
            {teams.length < 2 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Need at least 2 teams to start
              </p>
            )}
          </div>
        )}

        {!isHost && (
          <Card className="strategic-gradient border-primary/20">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Your team: <strong className="text-neon-cyan">{team?.team_name}</strong>
              </p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                The host will start the game when all teams are ready
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
