#!/usr/bin/env node

async function initVercelData() {
  const API_URL = process.env.API_URL || 'https://romai-mvp.vercel.app/api/admin/init-data';
  const MIGRATION_SECRET = process.env.MIGRATION_SECRET;

  if (!MIGRATION_SECRET) {
    console.error('❌ Variable MIGRATION_SECRET manquante');
    console.log('💡 Définissez: export MIGRATION_SECRET="votre-secret"');
    process.exit(1);
  }

  // Lire les données JSON
  const fs = require('fs');
  const romeData = JSON.parse(fs.readFileSync('rome_data.json', 'utf8'));
  
  console.log(`🚀 Initialisation des données sur ${API_URL}...`);
  console.log(`📊 ${romeData.occupations.length} occupations, ${romeData.tasks.length} tâches`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIGRATION_SECRET}`,
      },
      body: JSON.stringify(romeData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Initialisation réussie !');
      console.log(`📊 Résultat: ${result.stats?.occupations || 0} occupations, ${result.stats?.tasks || 0} tâches`);
    } else {
      console.error('❌ Erreur d\'initialisation:', result.error || result.details);
    }

  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

initVercelData();