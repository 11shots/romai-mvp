#!/usr/bin/env ts-node

const fs = require('fs');
const path = require('path');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const schema = require('../src/db/schema');

const sqlite = new Database('./sqlite.db');
const db = drizzle(sqlite, { schema });

type NewOccupation = typeof schema.occupation.$inferInsert;
type NewTask = typeof schema.task.$inferInsert;  
type NewAutomationScore = typeof schema.automationScore.$inferInsert;

interface RomeOccupation {
  code_rome: string;
  titre: string;
  secteur?: string;
  description?: string;
}

interface RomeTask {
  id: string;
  occupation_code_rome: string;
  libelle: string;
  description?: string;
}

const DEFAULT_AUTOMATION_SCORES = {
  // Scores par défaut basés sur le type de tâche (en %)
  'administratif': 65,
  'gestion': 55,
  'analyse': 45,
  'communication': 25,
  'créatif': 15,
  'management': 20,
  'technique': 70,
  'manuel': 35,
  'relationnel': 10,
  'conseil': 20,
  'enseignement': 25,
  'vente': 30,
  'production': 60,
  'maintenance': 50,
  'contrôle': 75,
  'recherche': 35,
};

function getAutomationScore(taskTitle: string, taskDescription?: string): number {
  const text = (taskTitle + ' ' + (taskDescription || '')).toLowerCase();
  
  // Analyse du contenu pour déterminer le type de tâche
  const keywords = {
    'administratif': ['saisie', 'formulaire', 'document', 'archive', 'classement', 'reporting'],
    'technique': ['programmer', 'développer', 'configurer', 'installer', 'paramétrer', 'automatiser'],
    'analyse': ['analyser', 'étudier', 'évaluer', 'diagnostiquer', 'mesurer', 'calculer'],
    'communication': ['communiquer', 'présenter', 'rédiger', 'expliquer', 'informer'],
    'créatif': ['créer', 'concevoir', 'designer', 'innover', 'imaginer'],
    'management': ['manager', 'diriger', 'coordonner', 'encadrer', 'superviser'],
    'manuel': ['fabriquer', 'assembler', 'réparer', 'manipuler', 'transporter'],
    'relationnel': ['accueillir', 'conseiller', 'négocier', 'accompagner', 'former'],
    'vente': ['vendre', 'commercial', 'client', 'prospect', 'devis'],
    'contrôle': ['contrôler', 'vérifier', 'inspecter', 'auditer', 'surveiller'],
    'gestion': ['gérer', 'planifier', 'organiser', 'budget', 'planning'],
    'production': ['produire', 'fabriquer', 'usiner', 'transformer'],
    'maintenance': ['maintenir', 'entretenir', 'dépanner', 'réviser'],
    'recherche': ['rechercher', 'étudier', 'expérimenter', 'investiguer'],
    'enseignement': ['enseigner', 'former', 'transmettre', 'éduquer']
  };

  let maxScore = 0;
  let bestCategory = 'manuel';

  for (const [category, categoryKeywords] of Object.entries(keywords)) {
    const matches = categoryKeywords.filter(keyword => text.includes(keyword)).length;
    if (matches > maxScore) {
      maxScore = matches;
      bestCategory = category;
    }
  }

  // Ajout de variabilité (+/- 15%)
  const baseScore = DEFAULT_AUTOMATION_SCORES[bestCategory as keyof typeof DEFAULT_AUTOMATION_SCORES] || 30;
  const variation = Math.random() * 30 - 15; // -15% à +15%
  const finalScore = Math.max(0, Math.min(100, baseScore + variation));

  return Math.round(finalScore);
}

async function importRomeData(filePath: string) {
  console.log('🚀 Starting ROME data import...');
  
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    let data: { occupations: RomeOccupation[], tasks: RomeTask[] };

    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      // Si ce n'est pas du JSON, essayer de parser comme CSV
      throw new Error('CSV parsing not implemented yet. Please provide JSON data.');
    }

    console.log(`📊 Found ${data.occupations?.length || 0} occupations and ${data.tasks?.length || 0} tasks`);

    // Import des occupations
    if (data.occupations && data.occupations.length > 0) {
      console.log('💼 Importing occupations...');
      
      const occupationsToInsert: NewOccupation[] = data.occupations.map(occ => ({
        codeRome: occ.code_rome,
        titre: occ.titre,
        secteur: occ.secteur || null,
        description: occ.description || null,
      }));

      // Insert par batch de 100
      for (let i = 0; i < occupationsToInsert.length; i += 100) {
        const batch = occupationsToInsert.slice(i, i + 100);
        await db.insert(schema.occupation).values(batch).onConflictDoUpdate({
          target: schema.occupation.codeRome,
          set: {
            titre: batch[0].titre,
            secteur: batch[0].secteur,
            description: batch[0].description,
            updatedAt: new Date(),
          },
        });
        console.log(`  ✅ Processed ${Math.min(i + 100, occupationsToInsert.length)}/${occupationsToInsert.length} occupations`);
      }
    }

    // Import des tâches
    if (data.tasks && data.tasks.length > 0) {
      console.log('📝 Importing tasks...');
      
      const tasksToInsert: NewTask[] = data.tasks.map(task => ({
        occupationCodeRome: task.occupation_code_rome,
        libelle: task.libelle,
        description: task.description || null,
      }));

      // Insert par batch de 100
      for (let i = 0; i < tasksToInsert.length; i += 100) {
        const batch = tasksToInsert.slice(i, i + 100);
        const insertedTasks = await db.insert(schema.task).values(batch).returning();
        
        // Générer les scores d'automatisation
        const automationScores: NewAutomationScore[] = insertedTasks.map((task: any) => ({
          taskId: task.id,
          scorePct: getAutomationScore(task.libelle, task.description || undefined),
          horizon: 'now' as const,
          source: 'default' as const,
        }));

        await db.insert(schema.automationScore).values(automationScores);
        
        console.log(`  ✅ Processed ${Math.min(i + 100, tasksToInsert.length)}/${tasksToInsert.length} tasks`);
      }
    }

    console.log('🎉 Import completed successfully!');
    
    // Statistiques finales
    const stats = await db.select({
      occupations: db.$count(schema.occupation),
      tasks: db.$count(schema.task),
      scores: db.$count(schema.automationScore),
    }).from(schema.occupation);

    console.log('📈 Final statistics:');
    console.log(`  - Occupations: ${stats[0]?.occupations || 0}`);
    console.log(`  - Tasks: ${stats[0]?.tasks || 0}`);
    console.log(`  - Automation scores: ${stats[0]?.scores || 0}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

// Utilisation du script
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];

  if (!filePath) {
    console.log('Usage: npm run import-rome <path-to-rome-data.json>');
    console.log('');
    console.log('Example JSON format:');
    console.log(JSON.stringify({
      occupations: [
        {
          code_rome: "M1805",
          titre: "Études et développement informatique",
          secteur: "Informatique",
          description: "Conception, développement et maintenance d'applications informatiques"
        }
      ],
      tasks: [
        {
          id: "1",
          occupation_code_rome: "M1805",
          libelle: "Développer des applications web",
          description: "Créer et maintenir des applications web responsive"
        }
      ]
    }, null, 2));
    process.exit(1);
  }

  importRomeData(path.resolve(filePath));
}

module.exports = { importRomeData };