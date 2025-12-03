import { useState, useEffect, useCallback } from 'react';
import { Search, Snowflake, AlertTriangle, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { GameClueCard } from '@/components/GameClueCard';
import { PlayerSelector } from '@/components/PlayerSelector';
import { useSupabaseGame, Answer } from '@/hooks/useSupabaseGame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [playerAnswers, setPlayerAnswers] = useState<Answer[]>([]);

  const {
    todayClues,
    loading,
    getPlayerTodayAnswers,
    hasPlayerCompletedToday,
    submitAnswer,
  } = useSupabaseGame();

  // Load saved player from localStorage
  useEffect(() => {
    const savedPlayerName = localStorage.getItem('mystery-player-name');
    if (savedPlayerName) {
      setCurrentPlayerName(savedPlayerName);
    }
  }, []);

  // Check if player has completed today and get their answers
  const checkPlayerStatus = useCallback(async () => {
    if (currentPlayerName) {
      const completed = await hasPlayerCompletedToday(currentPlayerName);
      setHasCompletedToday(completed);
      const answers = await getPlayerTodayAnswers(currentPlayerName);
      setPlayerAnswers(answers);
    }
  }, [currentPlayerName, hasPlayerCompletedToday, getPlayerTodayAnswers]);

  useEffect(() => {
    checkPlayerStatus();
  }, [checkPlayerStatus]);

  const handleSelectPlayer = async (playerName: string) => {
    setCurrentPlayerName(playerName);
    localStorage.setItem('mystery-player-name', playerName);

    // Check completion status immediately
    const completed = await hasPlayerCompletedToday(playerName);
    setHasCompletedToday(completed);
    const answers = await getPlayerTodayAnswers(playerName);
    setPlayerAnswers(answers);
  };

  const handleSubmitGuess = async (clueId: string, guess: string) => {
    if (!currentPlayerName) return { success: false, isCorrect: false };

    const result = await submitAnswer(currentPlayerName, clueId, guess);

    if (result.success) {
      // Refresh player status
      await checkPlayerStatus();
    }

    return result;
  };

  const handleChangePlayer = () => {
    setCurrentPlayerName(null);
    setHasCompletedToday(false);
    setPlayerAnswers([]);
    localStorage.removeItem('mystery-player-name');
  };

  const getAnswerForClue = (clueId: string) => {
    return playerAnswers.find(a => a.clue_id === clueId);
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

      {/* Clues Section */}
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
                  Tu as déjà participé aujourd'hui, reviens demain pour de nouveaux indices !
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {todayClues.length > 0 ? (
              todayClues.map((clue, index) => {
                const answer = getAnswerForClue(clue.id);
                return (
                  <GameClueCard
                    key={clue.id}
                    clue={clue}
                    clueIndex={index}
                    onSubmitGuess={handleSubmitGuess}
                    hasAnswered={!!answer}
                    wasCorrect={answer?.is_correct}
                    playerName={currentPlayerName}
                  />
                );
              })
            ) : (
              <div className="col-span-2 text-center py-16">
                <div className="inline-block p-8 bg-card/50 rounded-sm border border-border">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-typewriter text-xl text-muted-foreground mb-2">
                    AUCUN INDICE DISPONIBLE
                  </h3>
                  <p className="text-muted-foreground/70 font-serif">
                    Les enquêteurs n'ont pas encore révélé les indices du jour.
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
                Chaque jour, 2 nouveaux indices sont révélés (10 jours de jeu)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Identifiez le membre de l'équipe correspondant à chaque indice
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Chaque bonne réponse rapporte 1 point
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">•</span>
                Une seule participation par jour (2 réponses maximum)
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
