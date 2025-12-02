import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Save, X, FileText, Eye, Lock, Users, Trophy, Calendar, AlertCircle, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseGame, PlayerScore, Clue } from '@/hooks/useSupabaseGame';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const {
    players,
    allClues,
    today,
    loading,
    addClue,
    updateClue,
    deleteClue,
    getLeaderboard,
    updatePlayerName,
  } = useSupabaseGame();

  const { toast } = useToast();

  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');

  const [newClue, setNewClue] = useState({
    day: today,
    clueNumber: 1,
    text: '',
    answer: '',
  });

  const [editForm, setEditForm] = useState<Partial<Clue>>({});

  // Check if admin is authenticated from sessionStorage
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin-authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch leaderboard when authenticated
  const fetchLeaderboard = useCallback(async () => {
    if (isAuthenticated) {
      const data = await getLeaderboard();
      setLeaderboard(data);
    }
  }, [isAuthenticated, getLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { code: adminCode },
      });

      if (error) throw error;

      if (data.valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin-authenticated', 'true');
      } else {
        setAuthError('Code admin incorrect');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError('Erreur de vérification');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAddClue = async () => {
    if (!newClue.text.trim() || !newClue.answer.trim()) return;

    const result = await addClue(newClue.day, newClue.clueNumber, newClue.text, newClue.answer);

    if (result.success) {
      toast({ title: 'Indice ajouté', description: 'L\'indice a été créé avec succès.' });
      setNewClue({
        day: newClue.day,
        clueNumber: newClue.clueNumber === 1 ? 2 : 1,
        text: '',
        answer: '',
      });
      setIsAdding(false);
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  const handleStartEdit = (clue: Clue) => {
    setEditingId(clue.id);
    setEditForm(clue);
  };

  const handleSaveEdit = async () => {
    if (editingId && editForm) {
      const result = await updateClue(editingId, {
        text: editForm.text,
        answer: editForm.answer,
      });

      if (result.success) {
        toast({ title: 'Indice modifié', description: 'Les modifications ont été enregistrées.' });
        setEditingId(null);
        setEditForm({});
      } else {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
      }
    }
  };

  const handleDeleteClue = async (id: string) => {
    const result = await deleteClue(id);
    if (result.success) {
      toast({ title: 'Indice supprimé' });
    }
  };

  const handleStartEditPlayer = (player: { id: string; name: string }) => {
    setEditingPlayerId(player.id);
    setEditPlayerName(player.name);
  };

  const handleSavePlayerName = async () => {
    if (editingPlayerId && editPlayerName.trim()) {
      const result = await updatePlayerName(editingPlayerId, editPlayerName.trim());
      if (result.success) {
        toast({ title: 'Nom modifié' });
        await fetchLeaderboard();
      }
      setEditingPlayerId(null);
      setEditPlayerName('');
    }
  };

  // Group clues by day
  const groupedClues = allClues.reduce((acc, clue) => {
    const day = clue.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(clue);
    return acc;
  }, {} as Record<string, Clue[]>);

  // Stats for today
  const playersCompletedToday = leaderboard.filter(p => p.answers_today >= 2).length;
  const playersPartialToday = leaderboard.filter(p => p.answers_today === 1).length;
  const playersNotStarted = leaderboard.filter(p => p.answers_today === 0).length;

  // Auth screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background vignette">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle className="text-2xl">Zone Restreinte</CardTitle>
                <p className="text-muted-foreground font-serif">
                  Entrez le code administrateur pour accéder aux dossiers
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  <Input
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Code admin..."
                    className="text-center text-lg tracking-widest"
                  />
                  {authError && (
                    <p className="text-sm text-destructive text-center">{authError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isAuthLoading}>
                    {isAuthLoading ? 'Vérification...' : 'Accéder'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background vignette flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-accent animate-pulse mx-auto mb-4" />
          <p className="font-typewriter text-muted-foreground">Chargement des dossiers...</p>
        </div>
      </div>
    );
  }

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
            Tableau de Bord Admin
          </h1>
        </div>

        {/* Today's Summary */}
        <div className="max-w-5xl mx-auto mb-8">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Résumé du jour ({today})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-eranove-green/10 rounded-sm border border-eranove-green/30">
                  <div className="text-3xl font-typewriter text-eranove-green">{playersCompletedToday}</div>
                  <div className="text-sm text-muted-foreground">Terminé (2/2)</div>
                </div>
                <div className="text-center p-4 bg-eranove-yellow/10 rounded-sm border border-eranove-yellow/30">
                  <div className="text-3xl font-typewriter text-eranove-yellow">{playersPartialToday}</div>
                  <div className="text-sm text-muted-foreground">En cours (1/2)</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-sm border border-primary/30">
                  <div className="text-3xl font-typewriter text-primary">{playersNotStarted}</div>
                  <div className="text-sm text-muted-foreground">Non commencé</div>
                </div>
              </div>

              {playersCompletedToday < 16 && (
                <div className="flex items-center gap-2 p-3 bg-primary/20 rounded-sm border border-primary/30">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <span className="text-primary font-typewriter text-sm">
                    ATTENTION: Moins de 16 joueurs ont terminé aujourd'hui
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Player Status Grid */}
        <div className="max-w-5xl mx-auto mb-8">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Suivi des joueurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {leaderboard.map((player) => (
                  <div
                    key={player.player_id}
                    className={cn(
                      "p-3 rounded-sm border text-center transition-all",
                      player.answers_today >= 2 && "bg-eranove-green/10 border-eranove-green/30",
                      player.answers_today === 1 && "bg-eranove-yellow/10 border-eranove-yellow/30",
                      player.answers_today === 0 && "bg-primary/10 border-primary/30"
                    )}
                  >
                    {editingPlayerId === player.player_id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editPlayerName}
                          onChange={(e) => setEditPlayerName(e.target.value)}
                          className="h-7 text-xs"
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSavePlayerName}>
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPlayerId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-sm font-typewriter truncate">{player.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => handleStartEditPlayer({ id: player.player_id, name: player.name })}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className={cn(
                          "text-xs font-typewriter",
                          player.answers_today >= 2 && "text-eranove-green",
                          player.answers_today === 1 && "text-eranove-yellow",
                          player.answers_today === 0 && "text-primary"
                        )}>
                          {player.answers_today >= 2 ? '🟢' : player.answers_today === 1 ? '🟡' : '🔴'} {player.answers_today}/2
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <div className="max-w-5xl mx-auto mb-8">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                Classement Général
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.player_id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-sm border",
                      index === 0 && "bg-gold/10 border-gold/30",
                      index === 1 && "bg-gray-300/10 border-gray-300/30",
                      index === 2 && "bg-amber-600/10 border-amber-600/30",
                      index > 2 && "bg-secondary/30 border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full font-typewriter text-sm",
                        index === 0 && "bg-gold text-background",
                        index === 1 && "bg-gray-300 text-background",
                        index === 2 && "bg-amber-600 text-background",
                        index > 2 && "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </span>
                      <span className="font-typewriter">{player.name}</span>
                    </div>
                    <span className="text-xl font-typewriter text-gold">{player.score} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clue Management */}
        <div className="max-w-5xl mx-auto">
          <Card className="bg-card/80 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-accent" />
                Gestion des Indices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isAdding ? (
                <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un nouvel indice
                </Button>
              ) : (
                <div className="space-y-4 p-4 bg-secondary/30 rounded-sm border border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-typewriter text-accent">Nouvel Indice</h4>
                    <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-typewriter text-muted-foreground mb-1 block">JOUR</label>
                      <Input
                        type="date"
                        value={newClue.day}
                        onChange={(e) => setNewClue({ ...newClue, day: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-typewriter text-muted-foreground mb-1 block">INDICE N°</label>
                      <select
                        value={newClue.clueNumber}
                        onChange={(e) => setNewClue({ ...newClue, clueNumber: parseInt(e.target.value) })}
                        className="flex h-10 w-full rounded-sm border-2 border-accent/30 bg-secondary/50 px-4 py-2 text-base text-foreground"
                      >
                        <option value={1}>Indice 1</option>
                        <option value={2}>Indice 2</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-typewriter text-muted-foreground mb-1 block">CONTENU DE L'INDICE</label>
                    <textarea
                      value={newClue.text}
                      onChange={(e) => setNewClue({ ...newClue, text: e.target.value })}
                      placeholder="Description de l'indice..."
                      className="flex min-h-[100px] w-full rounded-sm border-2 border-accent/30 bg-secondary/50 px-4 py-2 text-base text-foreground font-serif resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-typewriter text-muted-foreground mb-1 block">RÉPONSE (NOM DU COLLÈGUE)</label>
                    <select
                      value={newClue.answer}
                      onChange={(e) => setNewClue({ ...newClue, answer: e.target.value })}
                      className="flex h-10 w-full rounded-sm border-2 border-accent/30 bg-secondary/50 px-4 py-2 text-base text-foreground"
                    >
                      <option value="">Sélectionnez...</option>
                      {players.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <Button onClick={handleAddClue} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer l'indice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clues History */}
          <div className="space-y-6">
            {Object.entries(groupedClues)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([day, clues]) => (
                <Card key={day} className="bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      {day} {day === today && <span className="text-xs bg-eranove-green/20 text-eranove-green px-2 py-1 rounded">AUJOURD'HUI</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {clues
                      .sort((a, b) => a.clue_number - b.clue_number)
                      .map((clue) => (
                        <div
                          key={clue.id}
                          className="p-4 rounded-sm border bg-secondary/30 border-accent/20"
                        >
                          {editingId === clue.id ? (
                            <div className="space-y-4">
                              <textarea
                                value={editForm.text || ''}
                                onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                                className="flex min-h-[80px] w-full rounded-sm border-2 border-accent/30 bg-secondary/50 px-4 py-2 text-base text-foreground font-serif resize-none"
                              />
                              <select
                                value={editForm.answer || ''}
                                onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                                className="flex h-10 w-full rounded-sm border-2 border-accent/30 bg-secondary/50 px-4 py-2 text-base text-foreground"
                              >
                                {players.map(p => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={handleSaveEdit}>
                                  <Save className="w-4 h-4 mr-1" />
                                  Sauvegarder
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditForm({}); }}>
                                  <X className="w-4 h-4 mr-1" />
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <span className="font-typewriter text-sm text-accent">
                                  INDICE #{clue.clue_number}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleStartEdit(clue)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClue(clue.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-foreground/80 font-serif italic mb-2">"{clue.text}"</p>
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
        </div>
      </main>
    </div>
  );
};

export default Admin;
