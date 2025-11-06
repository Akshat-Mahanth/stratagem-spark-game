import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Join = () => {
  const [teamName, setTeamName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim() || !gameCode.trim()) {
      toast.error("Please enter both team name and game code");
      return;
    }

    setIsJoining(true);

    try {
      // Find the game
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("game_code", gameCode.toUpperCase())
        .single();

      if (gameError || !game) {
        toast.error("Game not found. Check your game code.");
        return;
      }

      if (game.status === "completed") {
        toast.error("This game has already ended");
        return;
      }

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          game_id: game.id,
          team_name: teamName,
          current_capital: game.starting_capital,
        })
        .select()
        .single();

      if (teamError) {
        if (teamError.code === "23505") {
          toast.error("Team name already taken in this game");
        } else {
          throw teamError;
        }
        return;
      }

      toast.success(`Joined game as ${teamName}!`);
      navigate(`/game/${game.id}?team=${team.id}`);
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join game");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 text-neon-blue">
            Strategic Manufacturing
          </h1>
          <p className="text-xl text-muted-foreground">
            Join a competitive business simulation
          </p>
        </div>

        <Card className="strategic-gradient border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Join a Game</CardTitle>
            <CardDescription>
              Enter your team name and the game code provided by your host
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinGame} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Enter your team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameCode">Game Code</Label>
                <Input
                  id="gameCode"
                  placeholder="Enter 6-character game code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="h-12 text-lg font-mono tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  💡 <strong className="text-neon-cyan">Tip:</strong> Coordinate with your team members (3-4 people) 
                  before joining. You'll compete against other teams in a thrilling 
                  phone manufacturing simulation!
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg shadow-glow"
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Joining Game...
                  </>
                ) : (
                  "Join Game"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button 
            variant="link" 
            onClick={() => navigate("/")}
            className="text-primary hover:text-primary/80"
          >
            ← Back to home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Join;
