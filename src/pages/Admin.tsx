import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, FileText, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameStore } from '@/hooks/useGameStore';
import { Clue } from '@/types/game';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { state, addClue, updateClue, deleteClue } = useGameStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newClue, setNewClue] = useState({
    day: 1,
    clueNumber: 1 as 1 | 2,
    content: '',
    answer: '',
    revealed: false,
  });

  const [editForm, setEditForm] = useState<Partial<Clue>>({});

  const handleAddClue = () => {
    if (!newClue.content.trim() || !newClue.answer.trim()) return;
    
    addClue(newClue);
    setNewClue({
      day: newClue.day,
      clueNumber: newClue.clueNumber === 1 ? 2 : 1,
      content: '',
      answer: '',
      revealed: false,
    });
    setIsAdding(false);
  };

  const handleStartEdit = (clue: Clue) => {
    setEditingId(clue.id);
    setEditForm(clue);
  };

  const handleSaveEdit = () => {
    if (editingId && editForm) {
      updateClue(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const groupedClues = state.clues.reduce((acc, clue) => {
    if (!acc[clue.day]) acc[clue.day] = [];
    acc[clue.day].push(clue);
    return acc;
  }, {} as Record<number, Clue[]>);

  return (
    <div className="min-h-screen bg-background vignette">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-sm border border-primary/30 mb-6">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-typewriter text-sm text-primary uppercase tracking-wider">
              Zone Restreinte
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-typewriter text-accent mb-4 tracking-wider">
            Gestion des Dossiers
          </h1>
          <p className="text-lg text-foreground/80 font-serif italic">
            Administration des indices de l'enquête
          </p>
        </div>

        {/* Add new clue button */}
        <div className="max-w-3xl mx-auto mb-8">
          {!isAdding ? (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un nouvel indice
            </Button>
          ) : (
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-accent" />
                    Nouvel Indice
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-typewriter text-muted-foreground mb-1 block">
                      JOUR
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={newClue.day}
                      onChange={(e) => setNewClue({ ...newClue, day: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-typewriter text-muted-foreground mb-1 block">
                      INDICE N°
                    </label>
                    <select
                      value={newClue.clueNumber}
                      onChange={(e) => setNewClue({ ...newClue, clueNumber: parseInt(e.target.value) as 1 | 2 })}
                      className="flex h-10 w-full rounded-sm border-2 border-accent/30 bg-secondary/50 px-4 py-2 text-base text-foreground"
                    >
                      <option value={1}>Indice 1</option>
                      <option value={2}>Indice 2</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-typewriter text-muted-foreground mb-1 block">
                    CONTENU DE L'INDICE
                  </label>
                  <textarea
                    value={newClue.content}
                    onChange={(e) => setNewClue({ ...newClue, content: e.target.value })}
                    placeholder="Description de l'indice..."
                    className="flex min-h-[100px] w-full rounded-sm border-2 border-accent/30 bg-secondary/50 px-4 py-2 text-base text-foreground font-serif resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-typewriter text-muted-foreground mb-1 block">
                    RÉPONSE (NOM DU COLLÈGUE)
                  </label>
                  <Input
                    value={newClue.answer}
                    onChange={(e) => setNewClue({ ...newClue, answer: e.target.value })}
                    placeholder="Nom complet..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newClue.revealed}
                      onChange={(e) => setNewClue({ ...newClue, revealed: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-typewriter text-muted-foreground">
                      Révéler immédiatement
                    </span>
                  </label>
                </div>

                <Button onClick={handleAddClue} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer l'indice
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Clues list grouped by day */}
        <div className="max-w-3xl mx-auto space-y-6">
          {Object.entries(groupedClues)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([day, clues]) => (
              <Card key={day} className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    Jour {day}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clues
                    .sort((a, b) => a.clueNumber - b.clueNumber)
                    .map((clue) => (
                      <div
                        key={clue.id}
                        className={cn(
                          "p-4 rounded-sm border transition-all duration-300",
                          clue.revealed
                            ? "bg-secondary/50 border-accent/30"
                            : "bg-secondary/20 border-border"
                        )}
                      >
                        {editingId === clue.id ? (
                          <div className="space-y-4">
                            <textarea
                              value={editForm.content || ''}
                              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                              className="flex min-h-[80px] w-full rounded-sm border-2 border-accent/30 bg-secondary/50 px-4 py-2 text-base text-foreground font-serif resize-none"
                            />
                            <Input
                              value={editForm.answer || ''}
                              onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                              placeholder="Réponse..."
                            />
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={handleSaveEdit}>
                                <Save className="w-4 h-4 mr-1" />
                                Sauvegarder
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                <X className="w-4 h-4 mr-1" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-typewriter text-sm text-accent">
                                  INDICE #{clue.clueNumber}
                                </span>
                                {clue.revealed ? (
                                  <Eye className="w-4 h-4 text-green-500" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateClue(clue.id, { revealed: !clue.revealed })}
                                  title={clue.revealed ? "Masquer" : "Révéler"}
                                >
                                  {clue.revealed ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStartEdit(clue)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteClue(clue.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-foreground/80 font-serif italic mb-2">
                              "{clue.content}"
                            </p>
                            <p className="text-sm text-muted-foreground font-typewriter">
                              RÉPONSE: <span className="text-gold">{clue.answer}</span>
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
        </div>
      </main>
    </div>
  );
};

export default Admin;
