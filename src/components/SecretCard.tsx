import { useState } from 'react';
import { Send, Check, X, Lock, AlertTriangle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Secret, Guess } from '@/hooks/useGame';

interface SecretCardProps {
  secret: Secret;
  secretIndex: number;
  onSubmitGuess: (secretId: string, guessName: string) => Promise<{ success: boolean; isCorrect?: boolean; isFirstFinder?: boolean; error?: string }>;
  existingGuess?: Guess;
  playerName: string | null;
  onClose?: () => void;
}

export const SecretCard = ({
  secret,
  secretIndex,
  onSubmitGuess,
  existingGuess,
  playerName,
  onClose,
}: SecretCardProps) => {
  const [guessName, setGuessName] = useState('');
  const [result, setResult] = useState<{ isCorrect: boolean; isFirstFinder: boolean } | null>(
    existingGuess ? { isCorrect: existingGuess.is_correct, isFirstFinder: existingGuess.is_first_finder || false } : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasAnswered = !!existingGuess;
  const isTaken = !!secret.first_found_by;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessName.trim() || !playerName || hasAnswered) return;

    setIsSubmitting(true);
    setError('');

    const response = await onSubmitGuess(secret.id, guessName.trim());
    
    if (response.success) {
      setResult({ isCorrect: response.isCorrect || false, isFirstFinder: response.isFirstFinder || false });
    } else {
      setError(response.error || 'Une erreur est survenue');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Taken warning */}
      {isTaken && !hasAnswered && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <span className="text-sm text-destructive">
            Point déjà pris par <strong>{secret.first_found_by}</strong>
          </span>
        </div>
      )}

      {/* Secret title */}
      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <h3 className="text-foreground text-lg leading-relaxed font-medium mb-4">
          "{secret.title}"
        </h3>
        
        {/* Clues list */}
        {secret.clues.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Indices :</p>
            {secret.clues.map((clue, i) => (
              <div key={clue.id} className="flex gap-2 text-sm">
                <span className="text-primary font-semibold">#{i + 1}</span>
                <span className="text-foreground">{clue.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Aucun indice disponible.</p>
        )}
      </div>

      {/* Guess form or result */}
      {!hasAnswered ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              value={guessName}
              onChange={(e) => setGuessName(e.target.value)}
              placeholder="À qui appartient ce secret ?"
              disabled={!playerName || isSubmitting}
              className="bg-background border-border"
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
        <div className="space-y-3">
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg border",
            result?.isCorrect
              ? result?.isFirstFinder
                ? "bg-accent/20 border-accent/30"
                : "bg-primary/20 border-primary/30"
              : "bg-destructive/20 border-destructive/30"
          )}>
            {result?.isCorrect ? (
              result?.isFirstFinder ? (
                <>
                  <Trophy className="w-5 h-5 text-accent" />
                  <span className="text-accent font-semibold">
                    PREMIER TROUVEUR ! +1 POINT
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">
                    BONNE RÉPONSE (point déjà attribué)
                  </span>
                </>
              )
            ) : (
              <>
                <X className="w-5 h-5 text-destructive" />
                <span className="text-destructive font-medium">
                  MAUVAISE RÉPONSE
                </span>
              </>
            )}
          </div>

          {onClose && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Fermer
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
