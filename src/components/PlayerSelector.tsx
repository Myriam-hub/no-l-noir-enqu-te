import { useState } from 'react';
import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Player {
  id: string;
  name: string;
}

interface PlayerSelectorProps {
  players: Player[];
  onSelectPlayer: (playerId: string, playerName: string) => void;
  currentPlayer: string | null;
  hasCompletedToday: boolean;
}

export const PlayerSelector = ({
  players,
  onSelectPlayer,
  currentPlayer,
  hasCompletedToday,
}: PlayerSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId) {
      const player = players.find(p => p.id === selectedId);
      if (player) {
        onSelectPlayer(player.id, player.name);
      }
    }
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
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="flex-1 bg-secondary/50 border-accent/30">
              <SelectValue placeholder="Sélectionnez votre nom..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-accent/30 z-50">
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id} className="focus:bg-accent/20">
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="default" disabled={!selectedId}>
            <LogIn className="w-4 h-4 mr-2" />
            Commencer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
