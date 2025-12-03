import { useState } from 'react';
import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PlayerSelectorProps {
  onSelectPlayer: (playerName: string) => void;
  currentPlayer: string | null;
  hasCompletedToday: boolean;
}

export const PlayerSelector = ({
  onSelectPlayer,
  currentPlayer,
  hasCompletedToday,
}: PlayerSelectorProps) => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playerName.trim();
    
    if (trimmed.length < 2) {
      setError('Le nom doit contenir au moins 2 caractères');
      return;
    }
    
    if (trimmed.length > 50) {
      setError('Le nom est trop long (max 50 caractères)');
      return;
    }
    
    setError('');
    onSelectPlayer(trimmed);
  };

  if (currentPlayer) {
    return (
      <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-sm border border-accent/20">
        <User className="w-5 h-5 text-accent" />
        <div className="flex flex-col flex-1">
          <span className="text-xs text-muted-foreground font-typewriter">ENQUÊTEUR</span>
          <span className="text-accent font-serif">{currentPlayer}</span>
        </div>
        {hasCompletedToday && (
          <div className="px-2 py-1 bg-eranove-green/20 rounded text-xs font-typewriter text-eranove-green border border-eranove-green/30">
            TERMINÉ
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-accent" />
          Je suis...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Entrez votre prénom..."
            className="bg-secondary/50 border-accent/30"
            maxLength={50}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" variant="default" className="w-full" disabled={!playerName.trim()}>
            <LogIn className="w-4 h-4 mr-2" />
            Commencer l'enquête
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
