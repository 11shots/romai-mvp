'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Clock, TrendingUp, BarChart3, GitCompare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Task {
  id: number;
  libelle: string;
  automationScore?: number;
  analysis?: string;
  reasoning?: string;
}

interface OccupationData {
  codeRome: string;
  titre: string;
  slug: string;
  secteur?: string;
  description?: string;
  tasks: Task[];
  avgAutomationScore?: number;
}

interface ClientComponentProps {
  slug: string;
  initialData?: OccupationData;
}

export default function MetierClientComponent({ slug, initialData }: ClientComponentProps) {
  const [data, setData] = useState<OccupationData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    } else {
      // Si nous avons des données initiales, vérifier s'il faut déclencher une analyse
      const hasAnalysis = initialData.tasks?.some((task: Task) => task.automationScore !== undefined);
      if (!hasAnalysis && initialData.tasks?.length > 0) {
        setAnalyzing(true);
        triggerAnalysis(initialData.codeRome);
      }
    }
  }, [slug, initialData]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/occupations/${slug}/details-simple`);
      const result = await response.json();

      if (result.success) {
        const occupationData = {
          codeRome: result.occupation.codeRome,
          titre: result.occupation.titre,
          slug: result.occupation.slug,
          secteur: result.occupation.secteur,
          description: result.occupation.description,
          tasks: result.tasks,
          avgAutomationScore: result.tasks.length > 0 
            ? Math.round(result.tasks.reduce((sum: number, task: any) => sum + (task.automationScore || 0), 0) / result.tasks.length)
            : undefined
        };
        setData(occupationData);
        
        // Si aucune analyse n'existe, déclencher l'analyse automatique
        const hasAnalysis = result.tasks?.some((task: Task) => task.automationScore !== undefined);
        if (!hasAnalysis && result.tasks?.length > 0) {
          setAnalyzing(true);
          await triggerAnalysis(result.occupation.codeRome);
        }
      } else {
        setError(result.error || 'Métier non trouvé');
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async (codeRome: string) => {
    try {
      await fetch(`/api/occupations/${codeRome}/analyze`, { method: 'POST' });
      
      // Recharger les données après analyse
      const response = await fetch(`/api/occupations/${slug}/details-simple`);
      const result = await response.json();
      if (result.success) {
        const occupationData = {
          codeRome: result.occupation.codeRome,
          titre: result.occupation.titre,
          slug: result.occupation.slug,
          secteur: result.occupation.secteur,
          description: result.occupation.description,
          tasks: result.tasks,
          avgAutomationScore: result.tasks.length > 0 
            ? Math.round(result.tasks.reduce((sum: number, task: any) => sum + (task.automationScore || 0), 0) / result.tasks.length)
            : undefined
        };
        setData(occupationData);
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getAutomationColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getAutomationText = (score: number) => {
    if (score >= 70) return 'Forte';
    if (score >= 40) return 'Modérée';
    return 'Faible';
  };

  const getBadgeVariant = (score: number) => {
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'default';
    return 'secondary';
  };

  const getBadgeText = (score: number) => {
    if (score >= 70) return 'Forte automatisation';
    if (score >= 40) return 'Automatisation modérée';
    return 'Faible automatisation';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-muted-foreground">Chargement des données...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Métier non trouvé</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link href="/search" className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Retour à la recherche
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête du métier */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.titre}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Code ROME: <strong>{data.codeRome}</strong></span>
              {data.secteur && (
                <Badge variant="secondary">{data.secteur}</Badge>
              )}
            </div>
          </div>
          
          {data.avgAutomationScore !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(data.avgAutomationScore)}%
              </div>
              <div className={`text-sm font-medium ${getAutomationColor(data.avgAutomationScore)}`}>
                Automatisation {getAutomationText(data.avgAutomationScore).toLowerCase()}
              </div>
              <Progress value={data.avgAutomationScore} className="w-20 mt-2" />
            </div>
          )}
        </div>
        
        {data.description && (
          <p className="text-gray-700 leading-relaxed">{data.description}</p>
        )}
      </div>

      {/* Message d'analyse en cours */}
      {analyzing && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
              <div>
                <h3 className="font-semibold text-blue-900">Analyse en cours...</h3>
                <p className="text-blue-700 text-sm">
                  L'IA analyse le potentiel d'automatisation des tâches de ce métier.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boutons d'action */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Actions disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`/simulate/${data.codeRome}`} className="flex-1">
              <Button className="w-full flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Simuler l'automatisation
              </Button>
            </Link>
            <Link href="/compare" className="flex-1">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <GitCompare className="w-4 h-4" />
                Comparer avec d'autres métiers
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            <strong>Simuler :</strong> Ajustez le temps consacré à chaque tâche pour obtenir un score d'automatisation personnalisé.
            <br />
            <strong>Comparer :</strong> Analysez les différences d'automatisation entre plusieurs métiers.
          </p>
        </CardContent>
      </Card>

      {/* Section des tâches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tâches et niveau d'automatisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.tasks?.length > 0 ? (
            <div className="space-y-4">
              {data.tasks.map((task) => (
                <div key={task.id} className="border-l-4 border-gray-200 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{task.libelle}</h4>
                      {task.analysis && (
                        <p className="text-sm text-gray-600 mb-1">{task.analysis}</p>
                      )}
                      {task.reasoning && (
                        <p className="text-xs text-gray-500">{task.reasoning}</p>
                      )}
                    </div>
                    
                    {task.automationScore !== undefined ? (
                      <div className="ml-4 text-right">
                        <div className={`text-lg font-bold ${getAutomationColor(task.automationScore)}`}>
                          {task.automationScore}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {getAutomationText(task.automationScore)}
                        </div>
                      </div>
                    ) : (
                      <div className="ml-4 flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-xs">En attente</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucune tâche disponible pour ce métier.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}