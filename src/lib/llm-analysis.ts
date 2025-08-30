import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TaskAnalysis {
  taskId: number;
  libelle: string;
  automationScore: number;
  analysis: string;
  reasoning: string;
}

export interface OccupationAnalysis {
  occupationCode: string;
  overallScore: number;
  summary: string;
  tasks: TaskAnalysis[];
}

export async function analyzeOccupationTasks(
  occupation: { codeRome: string; titre: string; secteur?: string; description?: string },
  tasks: { id: number; libelle: string; description?: string }[]
): Promise<OccupationAnalysis> {
  const prompt = `
Tu es un expert en automatisation des métiers et en intelligence artificielle. Analyse le métier suivant et ses tâches pour déterminer leur potentiel d'automatisation.

**MÉTIER À ANALYSER:**
- Code ROME: ${occupation.codeRome}
- Titre: ${occupation.titre}
- Secteur: ${occupation.secteur || 'Non spécifié'}
- Description: ${occupation.description || 'Non spécifiée'}

**TÂCHES À ANALYSER:**
${tasks.map(task => `
- ID: ${task.id}
- Libellé: ${task.libelle}
- Description: ${task.description || 'Non spécifiée'}
`).join('')}

**INSTRUCTIONS:**
1. Pour chaque tâche, évalue son potentiel d'automatisation sur une échelle de 0 à 100 :
   - 0-20 : Très faible (tâches nécessitant créativité, empathie, jugement complexe)
   - 21-40 : Faible (tâches nécessitant interaction humaine, adaptation contextuelle)
   - 41-60 : Modéré (tâches partiellement automatisables avec supervision)
   - 61-80 : Élevé (tâches répétitives, règles claires, données structurées)
   - 81-100 : Très élevé (tâches purement mécaniques, calculatoires)

2. Fournis une analyse détaillée pour chaque tâche expliquant pourquoi ce score.

3. Calcule un score global pour le métier (moyenne pondérée).

4. Fournis un résumé général de l'impact de l'automatisation sur ce métier.

**RÉPONSE OBLIGATOIRE EN JSON:**
{
  "occupationCode": "${occupation.codeRome}",
  "overallScore": number,
  "summary": "résumé général de l'impact de l'automatisation sur ce métier (2-3 phrases)",
  "tasks": [
    {
      "taskId": number,
      "libelle": "nom de la tâche",
      "automationScore": number,
      "analysis": "analyse détaillée de cette tâche (1-2 phrases)",
      "reasoning": "justification du score attribué (1 phrase)"
    }
  ]
}

Réponds UNIQUEMENT avec le JSON, sans texte additionnel.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en automatisation des métiers. Tu réponds toujours avec du JSON valide uniquement, sans texte additionnel."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Aucune réponse de OpenAI');
    }

    // Parse le JSON de la réponse
    const analysis: OccupationAnalysis = JSON.parse(response);
    
    // Validation basique
    if (!analysis.occupationCode || !analysis.tasks || !Array.isArray(analysis.tasks)) {
      throw new Error('Format de réponse invalide');
    }

    return analysis;
  } catch (error) {
    console.error('Erreur lors de l\'analyse LLM:', error);
    throw new Error(`Erreur d'analyse LLM: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}