import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BarChart3, Users } from 'lucide-react';
import { db } from '@/db';
import { occupation, task, automationScore } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

interface TaskWithScore {
  id: number;
  libelle: string;
  description: string | null;
  automationScore: number;
  horizon: string;
}

interface OccupationDetail {
  codeRome: string;
  titre: string;
  secteur: string | null;
  description: string | null;
  tasks: TaskWithScore[];
  globalScore: number;
}

async function getOccupationDetail(code: string): Promise<OccupationDetail | null> {
  try {
    const occupationData = await db
      .select()
      .from(occupation)
      .where(eq(occupation.codeRome, code))
      .limit(1);

    if (occupationData.length === 0) {
      return null;
    }

    const tasksData = await db
      .select({
        id: task.id,
        libelle: task.libelle,
        description: task.description,
        automationScore: sql<number>`COALESCE(${automationScore.scorePct}, 0)`,
        horizon: sql<string>`COALESCE(${automationScore.horizon}, 'now')`,
      })
      .from(task)
      .leftJoin(
        automationScore,
        sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
      )
      .where(eq(task.occupationCodeRome, code))
      .orderBy(task.libelle);

    const tasks: TaskWithScore[] = tasksData.map(t => ({
      id: t.id,
      libelle: t.libelle,
      description: t.description,
      automationScore: Number(t.automationScore) || 0,
      horizon: t.horizon || 'now',
    }));

    const globalScore = tasks.length > 0 
      ? tasks.reduce((sum, task) => sum + task.automationScore, 0) / tasks.length 
      : 0;

    return {
      ...occupationData[0],
      tasks,
      globalScore,
    };
  } catch (error) {
    console.error('Error fetching occupation detail:', error);
    return null;
  }
}

export default async function MetierPage({ params }: { params: { code: string } }) {
  const occupationDetail = await getOccupationDetail(params.code);

  if (!occupationDetail) {
    notFound();
  }

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
            <h1 className="text-3xl font-bold mb-4">{occupationDetail.titre}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-sm">
                Code ROME: {occupationDetail.codeRome}
              </Badge>
              {occupationDetail.secteur && (
                <Badge variant="secondary" className="text-sm">
                  {occupationDetail.secteur}
                </Badge>
              )}
              <Badge 
                variant="outline"
                className={`text-sm ${getAutomationColor(occupationDetail.globalScore)}`}
              >
                {Math.round(occupationDetail.globalScore)}% {getAutomationText(occupationDetail.globalScore)}
              </Badge>
            </div>
            {occupationDetail.description && (
              <p className="text-muted-foreground leading-relaxed">
                {occupationDetail.description}
              </p>
            )}
          </div>

          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Score d'automatisation global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Progress value={occupationDetail.globalScore} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0%</span>
                    <span className={getAutomationColor(occupationDetail.globalScore)}>
                      {Math.round(occupationDetail.globalScore)}%
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
              <Link href={`/simulate/${occupationDetail.codeRome}`} className="flex-1">
                <Button className="w-full flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Simuler mon temps de travail
                </Button>
              </Link>
              <Link href={`/compare?a=${occupationDetail.codeRome}`} className="flex-1">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Comparer avec un autre métier
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              Tâches du métier ({occupationDetail.tasks.length})
            </h2>
            <div className="space-y-4">
              {occupationDetail.tasks.map((task) => (
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {occupationDetail.tasks.length === 0 && (
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