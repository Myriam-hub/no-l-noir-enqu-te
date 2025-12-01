import { useState } from 'react';
import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayerLoginProps {
  onLogin: (name: string) => void;
  currentPlayer: string | null;
}

export const PlayerLogin = ({ onLogin, currentPlayer }: PlayerLoginProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  if (currentPlayer) {
    return (
      <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-sm border border-accent/20">
        <User className="w-5 h-5 text-accent" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-typewriter">ENQUÊTEUR</span>
          <span className="text-accent font-serif">{currentPlayer}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-accent" />
          Identification Requise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom d'enquêteur..."
            className="flex-1"
          />
          <Button type="submit" variant="default" disabled={!name.trim()}>
            <LogIn className="w-4 h-4 mr-2" />
            Entrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
