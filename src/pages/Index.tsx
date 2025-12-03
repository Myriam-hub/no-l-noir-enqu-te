import { useState, useEffect, useCallback } from 'react';
import { Search, Snowflake, AlertTriangle, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { SecretCard } from '@/components/SecretCard';
import { PlayerSelector } from '@/components/PlayerSelector';
import { useGame, Guess } from '@/hooks/useGame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [playerGuesses, setPlayerGuesses] = useState<Guess[]>([]);

  const {
    todaySecrets,
    currentDay,
    loading,
    getPlayerGuesses,
    hasPlayerCompletedToday,
    submitGuess,
    refreshSecrets,
  } = useGame();

  // Load saved player from localStorage
  useEffect(() => {
    const savedPlayerName = localStorage.getItem('mystery-player-name');
    if (savedPlayerName) {
      setCurrentPlayerName(savedPlayerName);
    }
  }, []);

  // Check if player has completed today and get their guesses
  const checkPlayerStatus = useCallback(async () => {
    if (currentPlayerName) {
      const completed = await hasPlayerCompletedToday(currentPlayerName);
      setHasCompletedToday(completed);
      const guesses = await getPlayerGuesses(currentPlayerName);
      setPlayerGuesses(guesses);
    }
  }, [currentPlayerName, hasPlayerCompletedToday, getPlayerGuesses]);

  useEffect(() => {
    checkPlayerStatus();
  }, [checkPlayerStatus]);

  const handleSelectPlayer = async (playerName: string) => {
    setCurrentPlayerName(playerName);
    localStorage.setItem('mystery-player-name', playerName);

    // Check completion status immediately
    const completed = await hasPlayerCompletedToday(playerName);
    setHasCompletedToday(completed);
    const guesses = await getPlayerGuesses(playerName);
    setPlayerGuesses(guesses);
  };

  const handleSubmitGuess = async (secretId: string, guessName: string) => {
    if (!currentPlayerName) return { success: false, error: 'Non connecté' };

    const result = await submitGuess(currentPlayerName, secretId, guessName);

    if (result.success) {
      // Refresh player status
      await checkPlayerStatus();
    }

    return result;
  };

  const handleChangePlayer = () => {
    setCurrentPlayerName(null);
    setHasCompletedToday(false);
    setPlayerGuesses([]);
    localStorage.removeItem('mystery-player-name');
  };

  const getGuessForSecret = (secretId: string) => {
    return playerGuesses.find(g => g.secret_id === secretId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background vignette flex items-center justify-center">
        <div className="text-center">
          <Search className="w-12 h-12 text-accent animate-pulse mx-auto mb-4" />
          <p className="font-typewriter text-muted-foreground">Chargement de l'enquête...</p>
        </div>
      </div>
    );
  }

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
                Dossier Classé Confidentiel — Jour {currentDay}/10
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-typewriter text-accent mb-4 tracking-wider">
              Le Mystère du Personnel
            </h1>
            <p className="text-xl text-foreground/80 font-serif italic max-w-2xl mx-auto">
              Enquête de Noël — Chaque jour, découvrez 2 secrets et devinez à qui ils appartiennent.
            </p>

            {/* Decorative line */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent/50" />
              <Search className="w-6 h-6 text-accent" />
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent/50" />
            </div>
          </div>

          {/* Player selector */}
          <div className="max-w-md mx-auto space-y-4 mb-12">
            <PlayerSelector
              onSelectPlayer={handleSelectPlayer}
              currentPlayer={currentPlayerName}
              hasCompletedToday={hasCompletedToday}
            />
            {currentPlayerName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChangePlayer}
                className="w-full text-muted-foreground"
              >
                Changer de joueur
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Secrets Section */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          {/* Already completed message */}
          {hasCompletedToday && currentPlayerName && (
            <Card className="max-w-2xl mx-auto mb-8 bg-eranove-green/10 border-eranove-green/30">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 text-eranove-green mx-auto mb-4" />
                <h3 className="font-typewriter text-xl text-eranove-green mb-2">
                  PARTICIPATION TERMINÉE
                </h3>
                <p className="text-foreground/80 font-serif">
                  Tu as déjà participé aujourd'hui, reviens demain pour de nouveaux secrets !
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {todaySecrets.length > 0 ? (
              todaySecrets.map((secret, index) => {
                const guess = getGuessForSecret(secret.id);
                return (
                  <SecretCard
                    key={secret.id}
                    secret={secret}
                    secretIndex={index}
                    onSubmitGuess={handleSubmitGuess}
                    existingGuess={guess}
                    playerName={currentPlayerName}
                  />
                );
              })
            ) : (
              <div className="col-span-2 text-center py-16">
                <div className="inline-block p-8 bg-card/50 rounded-sm border border-border">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-typewriter text-xl text-muted-foreground mb-2">
                    AUCUN SECRET DISPONIBLE
                  </h3>
                  <p className="text-muted-foreground/70 font-serif">
                    Les enquêteurs n'ont pas encore révélé les secrets du jour.
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
                Le jeu dure 10 jours avec 2 secrets révélés chaque jour
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Cliquez sur un secret pour voir ses indices
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Devinez à qui appartient chaque secret
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Chaque bonne réponse rapporte 10 points
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
