import { useState, useEffect } from 'react';
import { Search, Snowflake, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { ClueCard } from '@/components/ClueCard';
import { PlayerLogin } from '@/components/PlayerLogin';
import { DaySelector } from '@/components/DaySelector';
import { useGameStore } from '@/hooks/useGameStore';

const Index = () => {
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  const {
    state,
    getCurrentDayClues,
    addPlayer,
    submitGuess,
    setCurrentDay,
    hasPlayerGuessedClue,
  } = useGameStore();

  useEffect(() => {
    const savedPlayer = localStorage.getItem('mystery-current-player');
    const savedPlayerId = localStorage.getItem('mystery-current-player-id');
    if (savedPlayer && savedPlayerId) {
      setCurrentPlayer(savedPlayer);
      setPlayerId(savedPlayerId);
    }
  }, []);

  const handleLogin = (name: string) => {
    const player = addPlayer(name);
    setCurrentPlayer(name);
    setPlayerId(player.id);
    localStorage.setItem('mystery-current-player', name);
    localStorage.setItem('mystery-current-player-id', player.id);
  };

  const handleSubmitGuess = (clueId: string, guess: string): boolean => {
    if (!playerId) return false;
    return submitGuess(playerId, clueId, guess);
  };

  const currentClues = getCurrentDayClues();
  const maxDay = Math.max(...state.clues.map(c => c.day), 1);

  return (
    <div className="min-h-screen bg-background vignette">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        {/* Floating snowflakes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <Snowflake
              key={i}
              className="absolute text-accent/10 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${20 + Math.random() * 20}px`,
                height: `${20 + Math.random() * 20}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-sm border border-primary/30 mb-6">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span className="font-typewriter text-sm text-primary uppercase tracking-wider">
                Dossier Classé Confidentiel
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-typewriter text-accent mb-4 tracking-wider">
              Le Mystère du Personnel
            </h1>
            <p className="text-xl text-foreground/80 font-serif italic max-w-2xl mx-auto">
              Enquête de Noël — Chaque jour, deux nouveaux indices vous mèneront 
              vers l'identité mystérieuse d'un membre de l'équipe.
            </p>

            {/* Decorative line */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent/50" />
              <Search className="w-6 h-6 text-accent" />
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent/50" />
            </div>
          </div>

          {/* Day selector and Player login */}
          <div className="max-w-md mx-auto space-y-6 mb-12">
            <DaySelector
              currentDay={state.currentDay}
              maxDay={maxDay}
              onDayChange={setCurrentDay}
            />
            <PlayerLogin onLogin={handleLogin} currentPlayer={currentPlayer} />
          </div>
        </div>
      </section>

      {/* Clues Section */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {currentClues.length > 0 ? (
              currentClues.map((clue, index) => (
                <ClueCard
                  key={clue.id}
                  clue={clue}
                  clueIndex={index}
                  onSubmitGuess={handleSubmitGuess}
                  hasGuessed={playerId ? hasPlayerGuessedClue(playerId, clue.id) : false}
                  playerName={currentPlayer || ''}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-16">
                <div className="inline-block p-8 bg-card/50 rounded-sm border border-border">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-typewriter text-xl text-muted-foreground mb-2">
                    AUCUN INDICE DISPONIBLE
                  </h3>
                  <p className="text-muted-foreground/70 font-serif">
                    Les enquêteurs n'ont pas encore révélé les indices du jour {state.currentDay}.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="max-w-2xl mx-auto mt-16 p-6 bg-secondary/30 rounded-sm border border-border">
            <h3 className="font-typewriter text-lg text-accent mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              RÈGLES DE L'ENQUÊTE
            </h3>
            <ul className="space-y-2 text-foreground/80 font-serif">
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Chaque jour, 2 nouveaux indices sont révélés
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Identifiez le membre de l'équipe correspondant à chaque indice
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Chaque bonne réponse rapporte 10 points
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Consultez le classement pour voir votre position
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
