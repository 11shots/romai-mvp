import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, BarChart3, Users } from "lucide-react";

export default function Home() {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Analysez l'automatisation de votre métier
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Découvrez quelles tâches de votre métier peuvent être automatisées et 
            simulez l'impact de l'IA sur votre secteur d'activité.
          </p>
          <Link href="/search">
            <Button size="lg" className="text-lg px-8 py-3">
              Commencer l'analyse
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Recherche de métiers
              </CardTitle>
              <CardDescription>
                Explorez les métiers du référentiel ROME et leurs tâches détaillées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/search">
                <Button variant="outline" className="w-full">
                  Rechercher un métier
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Simulation d'automatisation
              </CardTitle>
              <CardDescription>
                Calculez le potentiel d'automatisation selon votre temps de travail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/search">
                <Button variant="outline" className="w-full">
                  Simuler mon métier
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Comparaison de métiers
              </CardTitle>
              <CardDescription>
                Comparez le potentiel d'automatisation entre différents métiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/compare">
                <Button variant="outline" className="w-full">
                  Comparer des métiers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">À propos</h2>
          <p className="text-muted-foreground">
            Cette application analyse les métiers du référentiel ROME (Répertoire Opérationnel 
            des Métiers et des Emplois) de Pôle Emploi pour évaluer leur potentiel d'automatisation. 
            Elle vous permet de comprendre quelles tâches peuvent être automatisées maintenant, 
            dans 3 ans, ou dans 5 ans.
          </p>
        </div>
      </main>
    </div>
  );
}
