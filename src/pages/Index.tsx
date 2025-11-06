import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Trophy } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-neon-blue">
            Strategic Manufacturing
          </h1>
          <p className="text-2xl text-muted-foreground mb-8">
            Compete in a thrilling phone manufacturing simulation
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/host")}
              className="h-14 px-8 text-lg shadow-glow"
            >
              <Building2 className="mr-2 h-6 w-6" />
              Host a Game
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/join")}
              className="h-14 px-8 text-lg"
            >
              <Users className="mr-2 h-6 w-6" />
              Join a Game
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="metric-card border-primary/20">
            <CardContent className="pt-6">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Strategic Gameplay</h3>
              <p className="text-muted-foreground">
                Make critical decisions on production, pricing, R&D, and market allocation to maximize profit
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card border-primary/20">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-neon-cyan mb-4" />
              <h3 className="text-xl font-bold mb-2">Team Competition</h3>
              <p className="text-muted-foreground">
                Compete against 4-5 teams in real-time with live market updates and competitor insights
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card border-primary/20">
            <CardContent className="pt-6">
              <Trophy className="h-12 w-12 text-neon-gold mb-4" />
              <h3 className="text-xl font-bold mb-2">Stock Trading</h3>
              <p className="text-muted-foreground">
                Invest in competitors' stocks and diversify your strategy to dominate the market
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="strategic-gradient border-primary/20">
          <CardContent className="pt-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-neon-cyan">
              How It Works
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-3 text-primary">
                  Game Setup
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 8 quarters, 10 minutes each</li>
                  <li>• ₹1 crore starting capital</li>
                  <li>• 12 global cities with unique characteristics</li>
                  <li>• 4 phone tiers: Luxury, Flagship, Mid-tier, Lower-tier</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-neon-cyan">
                  Strategic Decisions
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Production volume & pricing</li>
                  <li>• Marketing, R&D, and employee budgets</li>
                  <li>• Factory location & distribution strategy</li>
                  <li>• Stock trading & debt management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
