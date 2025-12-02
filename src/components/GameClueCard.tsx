import { useState } from 'react';
import { FileText, Send, Check, X, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

interface Clue {
  id: string;
  day: string;
  clue_number: number;
  text: string;
  answer: string;
}

interface GameClueCardProps {
  clue: Clue;
  clueIndex: number;
  players: Player[];
  onSubmitGuess: (clueId: string, guess: string) => Promise<{ success: boolean; isCorrect: boolean }>;
  hasAnswered: boolean;
  wasCorrect?: boolean;
  playerName: string | null;
}

export const GameClueCard = ({
  clue,
  clueIndex,
  players,
  onSubmitGuess,
  hasAnswered,
  wasCorrect,
  playerName,
}: GameClueCardProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(
    hasAnswered ? (wasCorrect ? 'correct' : 'incorrect') : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnswer || !playerName || hasAnswered) return;

    setIsSubmitting(true);

    const { isCorrect } = await onSubmitGuess(clue.id, selectedAnswer);
    setResult(isCorrect ? 'correct' : 'incorrect');
    setIsSubmitting(false);
  };

  return (
    <Card
      className={cn(
        "paper-texture case-file relative overflow-hidden transition-all duration-500 animate-fade-in",
        result === 'correct' && "ring-2 ring-eranove-green/50",
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
              INDICE #{clue.clue_number}
            </CardTitle>
          </div>

          {hasAnswered && (
            <div className={cn(
              "stamp animate-stamp",
              result === 'correct' ? "text-eranove-green" : "text-primary"
            )}>
              <span className="font-typewriter text-lg border-2 border-current px-3 py-1 rounded-sm">
                {result === 'correct' ? 'RÉSOLU' : 'RÉPONDU'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-ink/60 font-typewriter">
          DOSSIER CONFIDENTIEL
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Clue content */}
        <div className="bg-paper/30 p-4 rounded-sm border border-ink/10">
          <p className="text-ink text-lg leading-relaxed font-serif italic">
            "{clue.text}"
          </p>
        </div>

        {/* Guess form */}
        {!hasAnswered ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Select value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={!playerName || isSubmitting}>
                <SelectTrigger className="bg-secondary/30 border-ink/20 text-ink">
                  <SelectValue placeholder="Sélectionnez un collègue..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-accent/30 z-50 max-h-60">
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.name} className="focus:bg-accent/20">
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!playerName && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="paper"
              className="w-full"
              disabled={!selectedAnswer || !playerName || isSubmitting}
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
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-sm border",
            result === 'correct'
              ? "bg-eranove-green/20 border-eranove-green/30"
              : "bg-primary/20 border-primary/30"
          )}>
            {result === 'correct' ? (
              <>
                <Check className="w-5 h-5 text-eranove-green" />
                <span className="text-eranove-green font-typewriter">
                  +1 POINT ATTRIBUÉ
                </span>
              </>
            ) : (
              <>
                <X className="w-5 h-5 text-primary" />
                <span className="text-primary font-typewriter">
                  MAUVAISE RÉPONSE
                </span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
