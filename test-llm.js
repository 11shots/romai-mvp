require('dotenv').config({ path: '.env.local' });
const { analyzeOccupationTasks } = require('./src/lib/llm-analysis.ts');

const testOccupation = {
  codeRome: 'A1101',
  titre: 'Conducteur / Conductrice d\'engins agricoles',
  secteur: 'Agriculture',
  description: 'Réalise des travaux agricoles mécanisés....'
};

const testTasks = [
  {
    id: 11,
    libelle: 'Aménage et prépare les terrains, assure le labourage, le désherbage',
    description: 'Aménage et prépare les terrains, assure le labourage, le désherbage, les semis et récolte la production'
  },
  {
    id: 12,
    libelle: 'Utilise différentes machines (tracteur, moissonneuse-batteuse)',
    description: 'Utilise différentes machines (tracteur, moissonneuse-batteuse, ensileuse) et en assure l\'entretien'
  }
];

async function test() {
  try {
    console.log('🔬 Test de l\'analyse LLM...');
    console.log('OpenAI API Key présente:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI API Key:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');
    
    const result = await analyzeOccupationTasks(testOccupation, testTasks);
    console.log('✅ Résultat:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();