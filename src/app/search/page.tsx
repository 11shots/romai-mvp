'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';

interface Occupation {
  codeRome: string;
  titre: string;
  slug?: string;
  secteur: string | null;
  description: string | null;
  taskCount: number;
  avgAutomationScore: number;
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchOccupations = async (term: string) => {
    if (!term.trim()) {
      setOccupations([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`/api/occupations/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      setOccupations(data.occupations || []);
    } catch (error) {
      console.error('Error searching occupations:', error);
      setOccupations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchOccupations(searchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const getAutomationColor = (score: number) => {
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'default';
    return 'secondary';
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
          <h1 className="text-3xl font-bold mb-8 text-center">
            Rechercher un métier
          </h1>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Tapez le nom d'un métier (ex: développeur, cuisinier, comptable...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-lg py-6"
            />
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Recherche en cours...</p>
            </div>
          )}

          {!loading && hasSearched && occupations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Aucun métier trouvé pour "{searchTerm}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Essayez avec des termes plus généraux ou vérifiez l'orthographe
              </p>
            </div>
          )}

          {!loading && occupations.length > 0 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {occupations.length} métier{occupations.length > 1 ? 's' : ''} trouvé{occupations.length > 1 ? 's' : ''}
              </p>
              
              {occupations.map((occupation) => (
                <Card key={occupation.codeRome} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {occupation.titre}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline">
                            Code ROME: {occupation.codeRome}
                          </Badge>
                          {occupation.secteur && (
                            <Badge variant="secondary">
                              {occupation.secteur}
                            </Badge>
                          )}
                          <Badge 
                            variant={getAutomationColor(occupation.avgAutomationScore)}
                          >
                            {Math.round(occupation.avgAutomationScore)}% {getAutomationText(occupation.avgAutomationScore)}
                          </Badge>
                        </div>
                        {occupation.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {occupation.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {occupation.taskCount} tâche{occupation.taskCount > 1 ? 's' : ''} analysée{occupation.taskCount > 1 ? 's' : ''}
                      </span>
                      <div className="flex gap-2">
                        <Link href={`/simulate/${occupation.codeRome}`}>
                          <Button variant="outline" size="sm">
                            Simuler
                          </Button>
                        </Link>
                        <Link href={`/metier/${occupation.slug || occupation.codeRome}`}>
                          <Button size="sm" className="flex items-center gap-1">
                            Voir détails
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Commencez à taper pour rechercher
              </h2>
              <p className="text-muted-foreground">
                Recherchez parmi tous les métiers du référentiel ROME
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}