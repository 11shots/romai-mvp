'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, BarChart3, Clock, Save } from 'lucide-react';

interface Task {
  id: number;
  libelle: string;
  description: string | null;
  automationScore: number;
}

interface Occupation {
  codeRome: string;
  titre: string;
  secteur: string | null;
  description: string | null;
}

interface SimulationData {
  occupation: Occupation;
  tasks: Task[];
}

interface TimeAllocation {
  [taskId: number]: number;
}

export default function SimulatePage({ params }: { params: { code: string } }) {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [timeAllocations, setTimeAllocations] = useState<TimeAllocation>({});
  const [totalHours, setTotalHours] = useState(35);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSimulationData();
  }, [params.code]);

  const loadSimulationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/occupations/${params.code}/simulation`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Métier non trouvé');
          return;
        }
        throw new Error('Erreur lors du chargement des données');
      }

      const data = await response.json();
      setSimulationData(data);
      
      const defaultAllocations: TimeAllocation = {};
      data.tasks.forEach((task: Task) => {
        defaultAllocations[task.id] = Math.round(35 / data.tasks.length);
      });
      setTimeAllocations(defaultAllocations);
    } catch (error) {
      console.error('Error loading simulation data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const updateTimeAllocation = (taskId: number, hours: number) => {
    setTimeAllocations(prev => ({
      ...prev,
      [taskId]: hours
    }));
  };

  const getCurrentTotal = () => {
    return Object.values(timeAllocations).reduce((sum, hours) => sum + hours, 0);
  };

  const calculateWeightedScore = () => {
    if (!simulationData || Object.keys(timeAllocations).length === 0) return 0;
    
    let weightedSum = 0;
    let totalTime = 0;
    
    simulationData.tasks.forEach(task => {
      const time = timeAllocations[task.id] || 0;
      weightedSum += task.automationScore * time;
      totalTime += time;
    });
    
    return totalTime > 0 ? weightedSum / totalTime : 0;
  };

  const redistributeHours = () => {
    if (!simulationData) return;
    
    const equalHours = Math.floor(totalHours / simulationData.tasks.length);
    const remainder = totalHours % simulationData.tasks.length;
    
    const newAllocations: TimeAllocation = {};
    simulationData.tasks.forEach((task, index) => {
      newAllocations[task.id] = equalHours + (index < remainder ? 1 : 0);
    });
    
    setTimeAllocations(newAllocations);
  };

  const saveSimulation = async () => {
    if (!simulationData) return;
    
    try {
      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          occupationCodeRome: simulationData.occupation.codeRome,
          timeAllocations,
          globalScore: calculateWeightedScore(),
        }),
      });
      
      if (response.ok) {
        alert('Simulation sauvegardée avec succès !');
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !simulationData) {
    notFound();
  }

  const weightedScore = calculateWeightedScore();
  const currentTotal = getCurrentTotal();

  const getAutomationColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getAutomationText = (score: number) => {
    if (score >= 70) return 'Forte automatisation';
    if (score >= 40) return 'Automatisation modérée';
    return 'Faible automatisation';
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              ROME AI
            </Link>
            <div className="flex gap-4">
              <Link href="/search">
                <Button variant="outline">Rechercher</Button>
              </Link>
              <Link href="/compare">
                <Button variant="outline">Comparer</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href={`/metier/${simulationData.occupation.codeRome}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au métier
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Simulateur d'automatisation
            </h1>
            <h2 className="text-xl text-muted-foreground mb-4">
              {simulationData.occupation.titre}
            </h2>
            <p className="text-muted-foreground">
              Ajustez le temps que vous consacrez à chaque tâche pour voir l'impact 
              sur votre potentiel d'automatisation personnalisé.
            </p>
          </div>

          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Score d'automatisation personnalisé</span>
                  <Button onClick={saveSimulation} size="sm" className="flex items-center gap-1">
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Progress value={weightedScore} className="mb-2 h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0%</span>
                    <span className={`text-lg font-semibold ${getAutomationColor(weightedScore)}`}>
                      {Math.round(weightedScore)}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline" className={getAutomationColor(weightedScore)}>
                    {getAutomationText(weightedScore)}
                  </Badge>
                  <span className="text-muted-foreground">
                    Basé sur {currentTotal}h de travail hebdomadaire
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Répartition du temps de travail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-medium">Total hebdomadaire:</span>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[totalHours]}
                      onValueChange={(value) => setTotalHours(value[0])}
                      min={10}
                      max={60}
                      step={1}
                      className="w-32"
                    />
                    <span className="text-sm font-medium w-8">{totalHours}h</span>
                  </div>
                  <Button 
                    onClick={redistributeHours} 
                    size="sm" 
                    variant="outline"
                  >
                    Répartir équitablement
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground mb-4">
                  Temps actuellement alloué: {currentTotal}h 
                  {currentTotal !== totalHours && (
                    <span className="text-yellow-600">
                      {" "}(différence de {Math.abs(currentTotal - totalHours)}h)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              Tâches du métier ({simulationData.tasks.length})
            </h3>
            
            {simulationData.tasks.map((task) => {
              const taskTime = timeAllocations[task.id] || 0;
              const taskPercentage = currentTotal > 0 ? (taskTime / currentTotal) * 100 : 0;
              
              return (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                          <h4 className="font-semibold text-lg mb-2">{task.libelle}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="outline"
                          className={getAutomationColor(task.automationScore)}
                        >
                          {Math.round(task.automationScore)}% automatisable
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Temps consacré:</span>
                          <span className="font-medium">
                            {taskTime}h/semaine ({Math.round(taskPercentage)}%)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground w-8">0h</span>
                          <Slider
                            value={[taskTime]}
                            onValueChange={(value) => updateTimeAllocation(task.id, value[0])}
                            min={0}
                            max={Math.min(totalHours, 50)}
                            step={0.5}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-8">{Math.min(totalHours, 50)}h</span>
                        </div>
                        
                        <Progress value={task.automationScore} className="h-2" />
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Impact sur votre temps: {Math.round(taskTime * task.automationScore / 100 * 10) / 10}h automatisables</span>
                          <span>{getAutomationText(task.automationScore)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {simulationData.tasks.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                Aucune tâche disponible pour ce métier
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Les données seront bientôt disponibles après import du référentiel ROME
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}