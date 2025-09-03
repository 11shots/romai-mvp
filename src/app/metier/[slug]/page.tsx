import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import MetierClientComponent from './client-component';

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

async function getOccupationData(slug: string): Promise<OccupationData | null> {
  try {
    // Importer directement les modules de base de données pour éviter les problèmes de fetch côté serveur
    const { db } = await import('@/db');
    const { task, automationScore, occupation } = await import('@/db/schema');
    const { eq, sql } = await import('drizzle-orm');

    // Déterminer si c'est un code ROME ou un slug
    const isCodeRome = /^[A-Z]\d{4}$/.test(slug);
    
    // Récupérer les informations du métier
    const occupationData = await db
      .select()
      .from(occupation)
      .where(isCodeRome ? eq(occupation.codeRome, slug) : eq(occupation.slug, slug))
      .limit(1);

    if (occupationData.length === 0) {
      return null;
    }

    const occ = occupationData[0];

    // Récupérer les tâches avec leurs scores d'automatisation (en évitant les doublons)
    const tasks = await db
      .select({
        id: task.id,
        libelle: task.libelle,
        description: task.description,
        libelleTypeTexte: task.libelleTypeTexte,
        automationScore: sql<number>`COALESCE(${automationScore.scorePct}, NULL)`,
        analysis: automationScore.analysis,
        reasoning: automationScore.reasoning,
      })
      .from(task)
      .leftJoin(
        automationScore,
        sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
      )
      .where(eq(task.occupationCodeRome, occ.codeRome))
      .groupBy(task.id, task.libelle, task.description, automationScore.scorePct, automationScore.analysis, automationScore.reasoning)
      .orderBy(task.libelle);

    // Filtrer pour ne garder que les vraies tâches (définitions)
    const realTasks = tasks.filter(t => t.libelleTypeTexte === 'definition');

    // Dédupliquer les tâches par libellé (au cas où il y aurait encore des doublons)
    const uniqueTasks = realTasks.reduce((acc, current) => {
      const existingTask = acc.find(task => task.libelle === current.libelle);
      if (!existingTask) {
        acc.push(current);
      } else if (current.automationScore && !existingTask.automationScore) {
        // Si la tâche actuelle a un score et l'existante n'en a pas, remplacer
        const index = acc.indexOf(existingTask);
        acc[index] = current;
      }
      return acc;
    }, [] as typeof realTasks);

    // Calculer le score moyen d'automatisation
    const scoresWithValues = uniqueTasks.filter(t => t.automationScore !== null);
    const avgAutomationScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, t) => sum + Number(t.automationScore), 0) / scoresWithValues.length
      : undefined;

    return {
      codeRome: occ.codeRome,
      titre: occ.titre,
      slug: occ.slug || slug,
      secteur: occ.secteur,
      description: occ.description,
      tasks: uniqueTasks.map(t => ({
        id: t.id,
        libelle: t.libelle,
        automationScore: t.automationScore ? Number(t.automationScore) : undefined,
        analysis: t.analysis,
        reasoning: t.reasoning,
      })),
      avgAutomationScore: avgAutomationScore ? Math.round(avgAutomationScore) : undefined,
    };
  } catch (error) {
    console.error('Error fetching occupation data:', error);
  }
  
  return null;
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getOccupationData(resolvedParams.slug);
  
  if (data) {
    const avgScore = data.avgAutomationScore ? Math.round(data.avgAutomationScore) : 'En cours';
    
    return {
      title: `${data.titre} - Analyse d'automatisation | ROME AI`,
      description: `Découvrez le potentiel d'automatisation du métier ${data.titre} (${data.codeRome}). Score moyen: ${avgScore}%. ${data.description ? data.description.substring(0, 150) + '...' : ''}`,
      openGraph: {
        title: `${data.titre} - Analyse d'automatisation`,
        description: `Potentiel d'automatisation: ${avgScore}%`,
        type: 'article',
        url: `https://romai-mvp.vercel.app/metier/${data.slug}`,
      },
      twitter: {
        card: 'summary',
        title: `${data.titre} - ROME AI`,
        description: `Analyse d'automatisation: ${avgScore}%`,
      },
      alternates: {
        canonical: `https://romai-mvp.vercel.app/metier/${data.slug}`,
      },
    };
  }
  
  return {
    title: 'Métier - ROME AI',
    description: 'Analyse d\'automatisation des métiers',
  };
}

async function MetierPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const initialData = await getOccupationData(resolvedParams.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              ROME AI
            </Link>
            <div className="flex gap-4">
              <Link href="/search" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Rechercher
              </Link>
              <Link href="/compare" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Comparer
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/search" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la recherche
          </Link>
          
          <MetierClientComponent 
            slug={resolvedParams.slug}
            initialData={initialData}
          />
        </div>
      </main>
    </div>
  );
}

export default function MetierPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <MetierPageContent params={params} />
    </Suspense>
  );
}