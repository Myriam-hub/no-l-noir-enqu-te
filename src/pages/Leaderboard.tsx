import { Trophy, Medal, User, Star } from 'lucide-react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameStore } from '@/hooks/useGameStore';
import { cn } from '@/lib/utils';

const Leaderboard = () => {
  const { getLeaderboard } = useGameStore();
  const leaderboard = getLeaderboard();

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-6 h-6 text-gold" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-typewriter text-muted-foreground">{position + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background vignette">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 rounded-sm border border-gold/30 mb-6">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="font-typewriter text-sm text-gold uppercase tracking-wider">
              Tableau d'Honneur
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-typewriter text-accent mb-4 tracking-wider">
            Classement des Enquêteurs
          </h1>
          <p className="text-lg text-foreground/80 font-serif italic">
            Les meilleurs détectives de l'enquête de Noël
          </p>
        </div>

        <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Star className="w-5 h-5 text-gold" />
              Top Enquêteurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-sm transition-all duration-300 hover:bg-accent/10 animate-slide-in",
                      index === 0 && "bg-gold/10 border border-gold/30",
                      index === 1 && "bg-gray-400/10 border border-gray-400/30",
                      index === 2 && "bg-amber-600/10 border border-amber-600/30",
                      index > 2 && "bg-secondary/30 border border-border"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {getMedalIcon(index)}
                    
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-secondary rounded-full">
                        <User className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-serif text-foreground">{player.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {player.correctAnswers} indice{player.correctAnswers !== 1 ? 's' : ''} résolu{player.correctAnswers !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-typewriter text-2xl text-gold">
                        {player.score}
                      </div>
                      <div className="text-xs text-muted-foreground font-typewriter">
                        POINTS
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-typewriter text-xl text-muted-foreground mb-2">
                  AUCUN ENQUÊTEUR
                </h3>
                <p className="text-muted-foreground/70 font-serif">
                  Soyez le premier à résoudre un indice !
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
