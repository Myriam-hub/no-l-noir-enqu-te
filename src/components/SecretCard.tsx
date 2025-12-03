import { useState } from 'react';
import { FileText, Send, Check, X, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Secret, Guess } from '@/hooks/useGame';

interface SecretCardProps {
  secret: Secret;
  secretIndex: number;
  onSubmitGuess: (secretId: string, guessName: string) => Promise<{ success: boolean; isCorrect?: boolean; error?: string }>;
  existingGuess?: Guess;
  playerName: string | null;
}

export const SecretCard = ({
  secret,
  secretIndex,
  onSubmitGuess,
  existingGuess,
  playerName,
}: SecretCardProps) => {
  const [guessName, setGuessName] = useState('');
  const [showClues, setShowClues] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(
    existingGuess ? (existingGuess.is_correct ? 'correct' : 'incorrect') : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasAnswered = !!existingGuess;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessName.trim() || !playerName || hasAnswered) return;

    setIsSubmitting(true);
    setError('');

    const response = await onSubmitGuess(secret.id, guessName.trim());
    
    if (response.success) {
      setResult(response.isCorrect ? 'correct' : 'incorrect');
    } else {
      setError(response.error || 'Une erreur est survenue');
    }
    
    setIsSubmitting(false);
  };

  return (
    <Card
      className={cn(
        "paper-texture case-file relative overflow-hidden transition-all duration-500 animate-fade-in",
        result === 'correct' && "ring-2 ring-eranove-green/50",
        result === 'incorrect' && "ring-2 ring-primary/50"
      )}
      style={{ animationDelay: `${secretIndex * 200}ms` }}
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
              SECRET #{secretIndex + 1}
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
        {/* Secret title */}
        <div className="bg-paper/30 p-4 rounded-sm border border-ink/10">
          <h3 className="text-ink text-lg leading-relaxed font-serif italic mb-2">
            "{secret.title}"
          </h3>
          
          {/* Toggle clues button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClues(!showClues)}
            className="w-full justify-between text-muted-foreground hover:text-accent"
          >
            <span>{showClues ? 'Masquer les indices' : `Voir les indices (${secret.clues.length})`}</span>
            {showClues ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          {/* Clues list */}
          {showClues && secret.clues.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-ink/10 pt-3">
              {secret.clues.map((clue, i) => (
                <div key={clue.id} className="flex gap-2 text-sm">
                  <span className="text-accent font-typewriter">#{i + 1}</span>
                  <span className="text-ink/80 font-serif">{clue.text}</span>
                </div>
              ))}
            </div>
          )}
          
          {showClues && secret.clues.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground italic">Aucun indice supplémentaire.</p>
          )}
        </div>

        {/* Guess form */}
        {!hasAnswered ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Input
                value={guessName}
                onChange={(e) => setGuessName(e.target.value)}
                placeholder="À qui appartient ce secret ?"
                disabled={!playerName || isSubmitting}
                className="bg-secondary/30 border-ink/20 text-ink"
                maxLength={100}
              />
              {!playerName && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              variant="paper"
              className="w-full"
              disabled={!guessName.trim() || !playerName || isSubmitting}
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
                  +10 POINTS ATTRIBUÉS
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
