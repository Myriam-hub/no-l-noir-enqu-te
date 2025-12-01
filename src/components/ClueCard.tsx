import { useState } from 'react';
import { FileText, Send, Check, X, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clue } from '@/types/game';
import { cn } from '@/lib/utils';

interface ClueCardProps {
  clue: Clue;
  clueIndex: number;
  onSubmitGuess: (clueId: string, guess: string) => boolean;
  hasGuessed: boolean;
  playerName: string;
}

export const ClueCard = ({
  clue,
  clueIndex,
  onSubmitGuess,
  hasGuessed,
  playerName,
}: ClueCardProps) => {
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !playerName || hasGuessed) return;

    setIsSubmitting(true);
    
    setTimeout(() => {
      const isCorrect = onSubmitGuess(clue.id, guess);
      setResult(isCorrect ? 'correct' : 'incorrect');
      setIsSubmitting(false);
      
      if (!isCorrect) {
        setTimeout(() => {
          setResult(null);
          setGuess('');
        }, 2000);
      }
    }, 500);
  };

  return (
    <Card
      className={cn(
        "paper-texture case-file relative overflow-hidden transition-all duration-500 animate-fade-in",
        result === 'correct' && "ring-2 ring-green-500/50",
        result === 'incorrect' && "ring-2 ring-primary/50"
      )}
      style={{ animationDelay: `${clueIndex * 200}ms` }}
    >
      {/* Paperclip decoration */}
      <div className="absolute -top-2 left-8 w-6 h-12 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full transform -rotate-12 shadow-md" />
      
      {/* Top fold effect */}
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-background" />

      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/50 rounded-sm">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="text-ink text-xl">
              INDICE #{clueIndex + 1}
            </CardTitle>
          </div>
          
          {hasGuessed && (
            <div className="stamp animate-stamp">
              <span className="font-typewriter text-lg border-2 border-current px-3 py-1 rounded-sm">
                RÉSOLU
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-2 text-xs text-ink/60 font-typewriter">
          JOUR {clue.day} • DOSSIER CONFIDENTIEL
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Clue content */}
        <div className="bg-paper/30 p-4 rounded-sm border border-ink/10">
          <p className="text-ink text-lg leading-relaxed font-serif italic">
            "{clue.content}"
          </p>
        </div>

        {/* Guess form */}
        {!hasGuessed ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Entrez le nom du suspect..."
                disabled={!playerName || isSubmitting}
                className="bg-secondary/30 border-ink/20 text-ink placeholder:text-ink/40 pr-12"
              />
              {!playerName && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <Button
              type="submit"
              variant="paper"
              className="w-full"
              disabled={!guess.trim() || !playerName || isSubmitting}
            >
              {isSubmitting ? (
                <span className="animate-pulse">Vérification...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Soumettre ma réponse
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-900/20 rounded-sm border border-green-500/30">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-green-400 font-typewriter">
              +10 POINTS ATTRIBUÉS
            </span>
          </div>
        )}

        {/* Result feedback */}
        {result === 'incorrect' && !hasGuessed && (
          <div className="flex items-center gap-2 p-3 bg-primary/20 rounded-sm border border-primary/30 animate-fade-in">
            <X className="w-5 h-5 text-primary" />
            <span className="text-primary font-typewriter">
              MAUVAISE PISTE - RÉESSAYEZ
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
