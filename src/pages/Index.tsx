import { useState, useEffect, useCallback } from 'react';
import { Search, User, FolderClosed, X, Gift, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { SecretCard } from '@/components/SecretCard';
import { PlayerSelector } from '@/components/PlayerSelector';
import { useGame, Guess } from '@/hooks/useGame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
const Index = () => {
  const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null);
  const [playerGuesses, setPlayerGuesses] = useState<Guess[]>([]);
  const [selectedSecret, setSelectedSecret] = useState<string | null>(null);
  const {
    allSecrets,
    loading,
    getPlayerGuesses,
    submitGuess,
    refreshSecrets
  } = useGame();

  // Load saved player from localStorage
  useEffect(() => {
    const savedPlayerName = localStorage.getItem('mystery-player-name');
    if (savedPlayerName) {
      setCurrentPlayerName(savedPlayerName);
    }
  }, []);

  // Fetch player guesses when player changes
  const fetchPlayerGuesses = useCallback(async () => {
    if (currentPlayerName) {
      const guesses = await getPlayerGuesses(currentPlayerName);
      setPlayerGuesses(guesses);
    }
  }, [currentPlayerName, getPlayerGuesses]);
  useEffect(() => {
    fetchPlayerGuesses();
  }, [fetchPlayerGuesses]);
  const handleSelectPlayer = async (playerName: string) => {
    setCurrentPlayerName(playerName);
    localStorage.setItem('mystery-player-name', playerName);
    const guesses = await getPlayerGuesses(playerName);
    setPlayerGuesses(guesses);
  };
  const handleSubmitGuess = async (secretId: string, guessName: string) => {
    if (!currentPlayerName) return {
      success: false,
      error: 'Non connecté'
    };
    const result = await submitGuess(currentPlayerName, secretId, guessName);
    if (result.success) {
      await fetchPlayerGuesses();
    }
    return result;
  };
  const handleChangePlayer = () => {
    setCurrentPlayerName(null);
    setPlayerGuesses([]);
    localStorage.removeItem('mystery-player-name');
  };
  const getGuessForSecret = (secretId: string) => {
    return playerGuesses.find(g => g.secret_id === secretId);
  };
  const hasAnsweredSecret = (secretId: string) => {
    return playerGuesses.some(g => g.secret_id === secretId);
  };
  const selectedSecretData = allSecrets.find(s => s.id === selectedSecret);

  // Create a shuffled but stable order for secret numbers (based on secret id)
  const getSecretNumber = (secretId: string) => {
    // Use a hash of the secret id to create a stable but shuffled number
    let hash = 0;
    for (let i = 0; i < secretId.length; i++) {
      hash = ((hash << 5) - hash) + secretId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 100) + 1; // Returns a number between 1-100
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Search className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de l'enquête...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 hero-gradient">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Enquête de Noël
              </span>
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Enquête Impossible</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez les secrets de vos collègues et soyez le premier à les identifier !
            </p>
          </div>

          {/* Player selector */}
          <div className="max-w-md mx-auto space-y-4 mb-8">
            <PlayerSelector onSelectPlayer={handleSelectPlayer} currentPlayer={currentPlayerName} hasCompletedToday={false} />
            {currentPlayerName && <Button variant="ghost" size="sm" onClick={handleChangePlayer} className="w-full text-muted-foreground">
                Changer de joueur
              </Button>}
          </div>

          {/* Introduction text - shown after player enters name */}
          {currentPlayerName && <Card className="max-w-2xl mx-auto mb-8 bg-card border-border animate-fade-in">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Bienvenue, {currentPlayerName} !
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>🔍 Cliquez sur un dossier pour découvrir les indices d'un secret.</p>
                  <p>🎯 Proposez le nom de la personne à qui appartient ce secret.</p>
                  <p>⭐ Le premier à trouver gagne <span className="text-accent font-semibold">1 point</span> !</p>
                  <p>❌ Une fois un secret trouvé, il est marqué d'une croix rouge.</p>
                </div>
              </CardContent>
            </Card>}
        </div>
      </section>

      {/* Secrets Grid Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {!currentPlayerName ? <div className="text-center py-16">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl text-muted-foreground mb-2">
                Entrez votre nom pour commencer
              </h3>
              <p className="text-muted-foreground/70">
                Identifiez-vous pour accéder aux secrets
              </p>
            </div> : allSecrets.length > 0 ? <>
              {/* Secrets as Icons */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
                  Les Dossiers Secrets ({allSecrets.length}/20)
                </h2>
                <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                  {allSecrets.filter(s => !s.first_found_by).map((secret) => {
                const isAnswered = hasAnsweredSecret(secret.id);
                const secretNumber = getSecretNumber(secret.id);
                const guess = getGuessForSecret(secret.id);
                return <button key={secret.id} onClick={() => setSelectedSecret(secret.id)} className={`
                          secret-icon relative
                          bg-card border-2 border-border
                          ${isAnswered ? 'opacity-60' : ''}
                        `} title={`Secret #${secretNumber}`}>
                        <FolderClosed className="w-10 h-10 text-primary" />
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-semibold">
                          {secretNumber}
                        </span>
                        {isAnswered && guess?.is_correct && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                            ✓
                          </div>}
                      </button>;
              })}
                </div>
              </div>


              {/* Rules */}
              <div className="max-w-2xl mx-auto mt-12 p-6 bg-muted/30 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Règles du Jeu
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    {allSecrets.length} secrets à découvrir
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    Le premier à trouver chaque secret gagne 1 point
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    Vous ne pouvez répondre qu'une seule fois par secret
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    Les secrets trouvés sont marqués d'une ❌
                  </li>
                </ul>
              </div>
            </> : <div className="text-center py-16">
              <FolderClosed className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl text-muted-foreground mb-2">
                Aucun secret disponible
              </h3>
              <p className="text-muted-foreground/70">
                Les enquêteurs n'ont pas encore révélé les secrets.
              </p>
            </div>}
        </div>
      </section>

      {/* Secret Detail Dialog */}
      <Dialog open={!!selectedSecret} onOpenChange={open => !open && setSelectedSecret(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderClosed className="w-5 h-5 text-primary" />
              Secret #{selectedSecret ? getSecretNumber(selectedSecret) : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedSecretData && <SecretCard secret={selectedSecretData} secretIndex={allSecrets.findIndex(s => s.id === selectedSecret)} onSubmitGuess={handleSubmitGuess} existingGuess={getGuessForSecret(selectedSecretData.id)} playerName={currentPlayerName} onClose={() => setSelectedSecret(null)} />}
        </DialogContent>
      </Dialog>
    </div>;
};
export default Index;