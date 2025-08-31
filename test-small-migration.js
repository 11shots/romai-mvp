#!/usr/bin/env node

const fs = require('fs');

async function testSmallMigration() {
  // Lire seulement les 10 premières occupations et leurs tâches
  const fullData = JSON.parse(fs.readFileSync('rome_data.json', 'utf8'));
  
  const smallData = {
    occupations: fullData.occupations.slice(0, 10),
    tasks: fullData.tasks.filter(task => 
      fullData.occupations.slice(0, 10).some(occ => occ.code_rome === task.occupation_code_rome)
    )
  };

  console.log(`📊 Test avec ${smallData.occupations.length} occupations, ${smallData.tasks.length} tâches`);

  const API_URL = process.env.API_URL || 'https://romai-mvp.vercel.app/api/admin/migrate';
  const MIGRATION_SECRET = process.env.MIGRATION_SECRET;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIGRATION_SECRET}`,
      },
      body: JSON.stringify(smallData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Migration test réussie !');
      console.log(`📊 Résultat: ${result.stats?.occupations || 0} occupations, ${result.stats?.tasks || 0} tâches`);
    } else {
      console.error('❌ Erreur de migration:', result.error || result.details);
    }

  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

testSmallMigration();