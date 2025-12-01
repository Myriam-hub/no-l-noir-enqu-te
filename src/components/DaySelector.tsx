import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DaySelectorProps {
  currentDay: number;
  maxDay: number;
  onDayChange: (day: number) => void;
}

export const DaySelector = ({ currentDay, maxDay, onDayChange }: DaySelectorProps) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDayChange(Math.max(1, currentDay - 1))}
        disabled={currentDay <= 1}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-3 px-6 py-3 bg-secondary/50 rounded-sm border border-accent/20">
        <Calendar className="w-5 h-5 text-accent" />
        <div className="text-center">
          <div className="text-xs text-muted-foreground font-typewriter">JOUR</div>
          <div className="text-2xl font-typewriter text-gold">{currentDay}</div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDayChange(Math.min(maxDay, currentDay + 1))}
        disabled={currentDay >= maxDay}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};
