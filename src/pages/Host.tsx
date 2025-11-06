import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Host = () => {
  const [hostName, setHostName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const generateGameCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsCreating(true);

    try {
      const gameCode = generateGameCode();
      
      const { data, error } = await supabase
        .from("games")
        .insert({
          game_code: gameCode,
          host_name: hostName,
          status: "waiting",
          max_quarters: 8,
          quarter_duration_seconds: 600,
          starting_capital: 10000000,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Game created! Code: ${gameCode}`);
      navigate(`/game/${data.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    } finally {
      setIsCreating(false);
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
            Create a competitive business simulation
          </p>
        </div>

        <Card className="strategic-gradient border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Host a New Game</CardTitle>
            <CardDescription>
              Create a game session for teams to compete in phone manufacturing simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGame} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hostName">Your Name</Label>
                <Input
                  id="hostName"
                  placeholder="Enter your name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-semibold mb-2 text-neon-cyan">Game Settings:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 8 quarters total</li>
                  <li>• 10 minutes per quarter</li>
                  <li>• ₹1 crore starting capital</li>
                  <li>• Real-time competition & trading</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg shadow-glow"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Game...
                  </>
                ) : (
                  "Create Game Session"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button 
            variant="link" 
            onClick={() => navigate("/join")}
            className="text-primary hover:text-primary/80"
          >
            Join an existing game →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Host;
