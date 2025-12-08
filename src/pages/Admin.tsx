import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, Edit2, Save, X, FileText, Lock, Users, Trophy, Calendar as CalendarIcon, AlertCircle, Settings, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAdminGame, Secret } from '@/hooks/useAdminGame';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [storedAdminCode, setStoredAdminCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const {
    secrets,
    dailySecrets,
    gameStats,
    gameConfig,
    leaderboard,
    allGuesses,
    currentDay,
    loading,
    loadAdminData,
    addSecret,
    updateSecret,
    deleteSecret,
    addClue,
    updateClue,
    deleteClue,
    setDaySecrets,
    updateGameConfig,
    refreshStats,
  } = useAdminGame(storedAdminCode);

  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'stats' | 'secrets' | 'settings'>('stats');
  const [isAddingSecret, setIsAddingSecret] = useState(false);
  const [newSecret, setNewSecret] = useState({ title: '', person_name: '' });
  const [editingSecretId, setEditingSecretId] = useState<string | null>(null);
  const [editSecretForm, setEditSecretForm] = useState({ title: '', person_name: '' });
  const [newClueText, setNewClueText] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Initialize dates from gameConfig
  useEffect(() => {
    if (gameConfig) {
      setStartDate(new Date(gameConfig.start_date));
      setEndDate(new Date(gameConfig.end_date));
    }
  }, [gameConfig]);

  // Load admin data when authenticated
  useEffect(() => {
    if (isAuthenticated && storedAdminCode) {
      loadAdminData();
    }
  }, [isAuthenticated, storedAdminCode, loadAdminData]);

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
        setStoredAdminCode(adminCode);
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

  const handleAddSecret = async () => {
    if (!newSecret.title.trim() || !newSecret.person_name.trim()) return;

    const result = await addSecret(newSecret.title, newSecret.person_name);

    if (result.success) {
      toast({ title: 'Secret ajouté', description: 'Le secret a été créé avec succès.' });
      setNewSecret({ title: '', person_name: '' });
      setIsAddingSecret(false);
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  const handleUpdateSecret = async (secretId: string) => {
    const result = await updateSecret(secretId, {
      title: editSecretForm.title,
      person_name: editSecretForm.person_name,
    });

    if (result.success) {
      toast({ title: 'Secret modifié' });
      setEditingSecretId(null);
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    if (!confirm('Supprimer ce secret ?')) return;
    
    const result = await deleteSecret(secretId);
    if (result.success) {
      toast({ title: 'Secret supprimé' });
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  const handleAddClue = async (secretId: string) => {
    const text = newClueText[secretId];
    if (!text?.trim()) return;

    const result = await addClue(secretId, text);
    if (result.success) {
      toast({ title: 'Indice ajouté' });
      setNewClueText({ ...newClueText, [secretId]: '' });
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeleteClue = async (clueId: string) => {
    const result = await deleteClue(clueId);
    if (result.success) {
      toast({ title: 'Indice supprimé' });
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  const handleSetDaySecrets = async (day: number, secret1Id: string | null, secret2Id: string | null) => {
    const result = await setDaySecrets(day, secret1Id, secret2Id);
    if (result.success) {
      toast({ title: `Jour ${day} configuré` });
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  const getDayConfig = (day: number) => {
    return dailySecrets.find(d => d.day === day);
  };

  const getSecretById = (id: string | null) => {
    if (!id) return null;
    return secrets.find(s => s.id === id);
  };

  // Stats
  const secretsFound = gameStats?.secretsFound || 0;
  const totalSecrets = gameStats?.totalSecrets || 0;
  const totalPlayers = gameStats?.totalPlayers || 0;

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
        <div className="text-center mb-8 animate-fade-in">
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

        {/* Tabs */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="flex gap-2 border-b border-border pb-2">
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('stats')}
            >
              <Users className="w-4 h-4 mr-2" />
              Statistiques
            </Button>
            <Button
              variant={activeTab === 'secrets' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('secrets')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Secrets ({secrets.length}/20)
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>

            {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Summary */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Résumé du Jeu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-3xl font-bold text-primary">{totalPlayers}</div>
                    <div className="text-sm text-muted-foreground">Joueurs</div>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="text-3xl font-bold text-accent">{secretsFound}</div>
                    <div className="text-sm text-muted-foreground">Secrets trouvés</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                    <div className="text-3xl font-bold text-secondary">{totalSecrets}</div>
                    <div className="text-sm text-muted-foreground">Secrets total</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  Classement (Premiers Trouveurs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((player, index) => (
                      <div
                        key={player.name}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          index === 0 && "bg-accent/10 border-accent/30",
                          index === 1 && "bg-muted border-border",
                          index === 2 && "bg-secondary/10 border-secondary/30",
                          index > 2 && "bg-muted/30 border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold",
                            index === 0 && "bg-accent text-accent-foreground",
                            index === 1 && "bg-muted-foreground/20 text-foreground",
                            index === 2 && "bg-secondary text-secondary-foreground",
                            index > 2 && "bg-muted text-muted-foreground"
                          )}>
                            {index + 1}
                          </span>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <span className="text-xl font-bold text-accent">{player.score} pt{player.score > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Aucun score enregistré</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Secrets Tab */}
        {activeTab === 'secrets' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    Gestion des Secrets ({secrets.length}/20)
                  </span>
                  {secrets.length < 20 && !isAddingSecret && (
                    <Button onClick={() => setIsAddingSecret(true)} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add secret form */}
                {isAddingSecret && (
                  <div className="p-4 bg-secondary/30 rounded-sm border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-typewriter text-accent">Nouveau Secret</h4>
                      <Button variant="ghost" size="icon" onClick={() => setIsAddingSecret(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      value={newSecret.title}
                      onChange={(e) => setNewSecret({ ...newSecret, title: e.target.value })}
                      placeholder="Titre du secret..."
                    />
                    <Input
                      value={newSecret.person_name}
                      onChange={(e) => setNewSecret({ ...newSecret, person_name: e.target.value })}
                      placeholder="Nom de la personne (réponse correcte)..."
                    />
                    <Button onClick={handleAddSecret} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                )}

                {/* Secrets list */}
                {secrets.map((secret) => (
                  <div key={secret.id} className="p-4 bg-secondary/30 rounded-sm border border-accent/20">
                    {editingSecretId === secret.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editSecretForm.title}
                          onChange={(e) => setEditSecretForm({ ...editSecretForm, title: e.target.value })}
                          placeholder="Titre..."
                        />
                        <Input
                          value={editSecretForm.person_name}
                          onChange={(e) => setEditSecretForm({ ...editSecretForm, person_name: e.target.value })}
                          placeholder="Personne..."
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdateSecret(secret.id)} size="sm">
                            <Save className="w-4 h-4 mr-1" /> Sauver
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingSecretId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-typewriter text-lg text-accent">{secret.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Réponse: <span className="text-eranove-green">{secret.person_name}</span>
                            </p>
                            {secret.first_found_by ? (
                              <p className="text-sm text-accent">
                                <Trophy className="w-3 h-3 inline mr-1" />
                                Trouvé par: <span className="font-semibold">{secret.first_found_by}</span>
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground/50 italic">
                                Pas encore trouvé
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingSecretId(secret.id);
                                setEditSecretForm({ title: secret.title, person_name: secret.person_name });
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSecret(secret.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Clues */}
                        <div className="border-t border-border/50 pt-3 mt-3">
                          <p className="text-xs text-muted-foreground font-typewriter mb-2">
                            INDICES ({secret.clues.length})
                          </p>
                          {secret.clues.map((clue, i) => (
                            <div key={clue.id} className="flex items-center justify-between py-1 text-sm">
                              <span className="text-foreground/80">
                                <span className="text-accent">#{i + 1}</span> {clue.text}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClue(clue.id)}
                                className="h-6 w-6 text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={newClueText[secret.id] || ''}
                              onChange={(e) => setNewClueText({ ...newClueText, [secret.id]: e.target.value })}
                              placeholder="Ajouter un indice..."
                              className="text-sm"
                            />
                            <Button size="sm" onClick={() => handleAddClue(secret.id)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {secrets.length === 0 && !isAddingSecret && (
                  <p className="text-center text-muted-foreground py-8 font-serif">
                    Aucun secret créé. Cliquez sur "Ajouter" pour commencer.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Configuration des Dates du Jeu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Date de début
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Date de fin
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    if (!startDate || !endDate) {
                      toast({ title: 'Erreur', description: 'Veuillez sélectionner les deux dates', variant: 'destructive' });
                      return;
                    }
                    const result = await updateGameConfig(
                      format(startDate, 'yyyy-MM-dd'),
                      format(endDate, 'yyyy-MM-dd')
                    );
                    if (result.success) {
                      toast({ title: 'Dates mises à jour', description: 'La configuration du jeu a été sauvegardée.' });
                    } else {
                      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
                    }
                  }}
                  className="mt-6 w-full md:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder les dates
                </Button>

                {gameConfig && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Configuration actuelle : du {format(new Date(gameConfig.start_date), "d MMMM yyyy", { locale: fr })} au {format(new Date(gameConfig.end_date), "d MMMM yyyy", { locale: fr })}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
