'use client';

import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BarChart3, Users, Loader2, Brain } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TaskWithScore {
  id: number;
  libelle: string;
  description: string | null;
  automationScore: number;
  analysis?: string | null;
  reasoning?: string | null;
}

interface OccupationDetail {
  codeRome: string;
  titre: string;
  secteur: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  occupation: OccupationDetail;
  tasks: TaskWithScore[];
  llmAnalysis?: {
    summary: string;
    overallScore: number;
  };
}


export default function MetierPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setAnalyzing(true);
        
        const response = await fetch(`/api/occupations/${resolvedParams.code}/details`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors du chargement');
        }
        
        if (!result.success) {
          throw new Error(result.error || 'Données non trouvées');
        }
        
        setData(result);
        setAnalyzing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setAnalyzing(false);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [resolvedParams.code]);

  if (loading) {
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
              <Link href="/search">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la recherche
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex items-center space-x-3 mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                {analyzing && <Brain className="w-8 h-8 text-purple-600 animate-pulse" />}
              </div>
              
              {analyzing ? (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Analyse en cours...</h2>
                  <p className="text-muted-foreground mb-4">
                    Notre IA analyse ce métier pour déterminer le potentiel d'automatisation de chaque tâche.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 max-w-md">
                    <p className="text-sm text-blue-800">
                      💡 Cette analyse prend en compte les compétences requises, 
                      la complexité des tâches et les technologies actuelles.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
                  <p className="text-muted-foreground">
                    Récupération des informations du métier
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold">
                ROME AI
              </Link>
            </nav>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { occupation, tasks, llmAnalysis } = data;
  
  const globalScore = llmAnalysis?.overallScore || 
    (tasks.length > 0 
      ? tasks.reduce((sum, task) => sum + task.automationScore, 0) / tasks.length 
      : 0);

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
            <Link href="/search">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la recherche
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{occupation.titre}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-sm">
                Code ROME: {occupation.codeRome}
              </Badge>
              {occupation.secteur && (
                <Badge variant="secondary" className="text-sm">
                  {occupation.secteur}
                </Badge>
              )}
              <Badge 
                variant="outline"
                className={`text-sm ${getAutomationColor(globalScore)}`}
              >
                {Math.round(globalScore)}% {getAutomationText(globalScore)}
              </Badge>
            </div>
            {occupation.description && (
              <p className="text-muted-foreground leading-relaxed">
                {occupation.description}
              </p>
            )}
            
            {llmAnalysis?.summary && (
              <Alert className="mt-4">
                <Brain className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <strong>Analyse IA:</strong> {llmAnalysis.summary}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Score d'automatisation global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Progress value={globalScore} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0%</span>
                    <span className={getAutomationColor(globalScore)}>
                      {Math.round(globalScore)}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ce score représente la moyenne d'automatisation de toutes les tâches de ce métier.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Link href={`/simulate/${occupation.codeRome}`} className="flex-1">
                <Button className="w-full flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Simuler mon temps de travail
                </Button>
              </Link>
              <Link href={`/compare?a=${occupation.codeRome}`} className="flex-1">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Comparer avec un autre métier
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              Tâches du métier ({tasks.length})
            </h2>
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg flex-1 mr-4">
                        {task.libelle}
                      </h3>
                      <Badge 
                        variant="outline"
                        className={getAutomationColor(task.automationScore)}
                      >
                        {Math.round(task.automationScore)}%
                      </Badge>
                    </div>
                    <Progress value={task.automationScore} className="mb-3" />
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{getAutomationText(task.automationScore)}</span>
                      <span>Horizon: maintenant</span>
                    </div>
                    {task.description && (
                      <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    {task.analysis && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900 font-medium mb-1">Analyse IA:</p>
                        <p className="text-sm text-blue-800">{task.analysis}</p>
                        {task.reasoning && (
                          <p className="text-xs text-blue-600 mt-2 italic">
                            Justification: {task.reasoning}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Aucune tâche enregistrée pour ce métier
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