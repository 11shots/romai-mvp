'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Search, Users, ArrowRight } from 'lucide-react';

interface Occupation {
  codeRome: string;
  titre: string;
  secteur: string | null;
  description: string | null;
  taskCount: number;
  avgAutomationScore: number;
}

interface ComparisonData {
  occupation: Occupation;
  tasks: Array<{
    id: number;
    libelle: string;
    automationScore: number;
  }>;
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [suggestionsA, setSuggestionsA] = useState<Occupation[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<Occupation[]>([]);
  const [selectedA, setSelectedA] = useState<Occupation | null>(null);
  const [selectedB, setSelectedB] = useState<Occupation | null>(null);
  const [comparisonData, setComparisonData] = useState<{
    a: ComparisonData | null;
    b: ComparisonData | null;
  }>({ a: null, b: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preselectedA = searchParams.get('a');
    const preselectedB = searchParams.get('b');
    
    if (preselectedA) {
      loadOccupationByCode(preselectedA, 'A');
    }
    if (preselectedB) {
      loadOccupationByCode(preselectedB, 'B');
    }
  }, [searchParams]);

  const loadOccupationByCode = async (code: string, slot: 'A' | 'B') => {
    try {
      const response = await fetch(`/api/occupations/search?q=${code}`);
      const data = await response.json();
      const occupation = data.occupations.find((occ: Occupation) => occ.codeRome === code);
      
      if (occupation) {
        if (slot === 'A') {
          setSelectedA(occupation);
          setSearchA(occupation.titre);
        } else {
          setSelectedB(occupation);
          setSearchB(occupation.titre);
        }
      }
    } catch (error) {
      console.error('Error loading occupation by code:', error);
    }
  };

  const searchOccupations = async (term: string, slot: 'A' | 'B') => {
    if (!term.trim()) {
      if (slot === 'A') setSuggestionsA([]);
      else setSuggestionsB([]);
      return;
    }

    try {
      const response = await fetch(`/api/occupations/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      if (slot === 'A') setSuggestionsA(data.occupations || []);
      else setSuggestionsB(data.occupations || []);
    } catch (error) {
      console.error('Error searching occupations:', error);
    }
  };

  const selectOccupation = (occupation: Occupation, slot: 'A' | 'B') => {
    if (slot === 'A') {
      setSelectedA(occupation);
      setSearchA(occupation.titre);
      setSuggestionsA([]);
    } else {
      setSelectedB(occupation);
      setSearchB(occupation.titre);
      setSuggestionsB([]);
    }
  };

  const loadComparison = async () => {
    if (!selectedA || !selectedB) return;

    setLoading(true);
    try {
      const [responseA, responseB] = await Promise.all([
        fetch(`/api/occupations/${selectedA.codeRome}/details`),
        fetch(`/api/occupations/${selectedB.codeRome}/details`)
      ]);

      const [dataA, dataB] = await Promise.all([
        responseA.json(),
        responseB.json()
      ]);

      setComparisonData({
        a: dataA.success ? {
          occupation: selectedA,
          tasks: dataA.tasks || []
        } : null,
        b: dataB.success ? {
          occupation: selectedB,
          tasks: dataB.tasks || []
        } : null
      });
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedA && selectedB) {
      loadComparison();
    }
  }, [selectedA, selectedB]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchOccupations(searchA, 'A');
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchA]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchOccupations(searchB, 'B');
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchB]);

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Comparer deux métiers
            </h1>
            <p className="text-muted-foreground">
              Comparez le potentiel d'automatisation entre deux métiers différents
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Métier A</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher le premier métier..."
                  value={searchA}
                  onChange={(e) => setSearchA(e.target.value)}
                  className="pl-10"
                />
              </div>
              {suggestionsA.length > 0 && (
                <div className="border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                  {suggestionsA.map((occupation) => (
                    <button
                      key={occupation.codeRome}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => selectOccupation(occupation, 'A')}
                    >
                      <div className="font-medium">{occupation.titre}</div>
                      <div className="text-sm text-muted-foreground">
                        {occupation.codeRome} • {Math.round(occupation.avgAutomationScore)}% automatisation
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Métier B</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher le second métier..."
                  value={searchB}
                  onChange={(e) => setSearchB(e.target.value)}
                  className="pl-10"
                />
              </div>
              {suggestionsB.length > 0 && (
                <div className="border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                  {suggestionsB.map((occupation) => (
                    <button
                      key={occupation.codeRome}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => selectOccupation(occupation, 'B')}
                    >
                      <div className="font-medium">{occupation.titre}</div>
                      <div className="text-sm text-muted-foreground">
                        {occupation.codeRome} • {Math.round(occupation.avgAutomationScore)}% automatisation
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement de la comparaison...</p>
            </div>
          )}

          {selectedA && selectedB && !loading && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Comparaison globale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{selectedA.titre}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Code ROME:</span>
                          <span>{selectedA.codeRome}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tâches:</span>
                          <span>{selectedA.taskCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Automatisation:</span>
                          <span className={getAutomationColor(selectedA.avgAutomationScore)}>
                            {Math.round(selectedA.avgAutomationScore)}% ({getAutomationText(selectedA.avgAutomationScore)})
                          </span>
                        </div>
                        <Progress value={selectedA.avgAutomationScore} className="mt-2" />
                      </div>
                      <Link href={`/metier/${selectedA.codeRome}`} className="mt-4 inline-block">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          Voir détails
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">{selectedB.titre}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Code ROME:</span>
                          <span>{selectedB.codeRome}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tâches:</span>
                          <span>{selectedB.taskCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Automatisation:</span>
                          <span className={getAutomationColor(selectedB.avgAutomationScore)}>
                            {Math.round(selectedB.avgAutomationScore)}% ({getAutomationText(selectedB.avgAutomationScore)})
                          </span>
                        </div>
                        <Progress value={selectedB.avgAutomationScore} className="mt-2" />
                      </div>
                      <Link href={`/metier/${selectedB.codeRome}`} className="mt-4 inline-block">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          Voir détails
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Analyse comparative</h4>
                    <div className="text-sm text-muted-foreground">
                      {selectedA.avgAutomationScore > selectedB.avgAutomationScore ? (
                        <p>
                          <strong>{selectedA.titre}</strong> présente un potentiel d'automatisation 
                          <strong> {Math.round(selectedA.avgAutomationScore - selectedB.avgAutomationScore)} points</strong> supérieur 
                          à <strong>{selectedB.titre}</strong>.
                        </p>
                      ) : selectedB.avgAutomationScore > selectedA.avgAutomationScore ? (
                        <p>
                          <strong>{selectedB.titre}</strong> présente un potentiel d'automatisation 
                          <strong> {Math.round(selectedB.avgAutomationScore - selectedA.avgAutomationScore)} points</strong> supérieur 
                          à <strong>{selectedA.titre}</strong>.
                        </p>
                      ) : (
                        <p>
                          Les deux métiers présentent un potentiel d'automatisation similaire.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedA && !selectedB && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Sélectionnez deux métiers à comparer
              </h2>
              <p className="text-muted-foreground">
                Utilisez les champs de recherche ci-dessus pour trouver les métiers que vous souhaitez comparer
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>}>
      <ComparePageContent />
    </Suspense>
  );
}