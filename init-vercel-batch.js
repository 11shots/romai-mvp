#!/usr/bin/env node

const fs = require('fs');

async function initVercelDataBatch() {
  const API_URL = process.env.API_URL || 'https://romai-mvp.vercel.app/api/admin/init-data';
  const MIGRATION_SECRET = process.env.MIGRATION_SECRET;

  if (!MIGRATION_SECRET) {
    console.error('❌ Variable MIGRATION_SECRET manquante');
    process.exit(1);
  }

  // Lire les données
  const romeData = JSON.parse(fs.readFileSync('rome_data.json', 'utf8'));
  console.log(`📊 Total: ${romeData.occupations.length} occupations, ${romeData.tasks.length} tâches`);

  // Diviser en lots plus petits
  const occupationBatchSize = 200;
  const taskBatchSize = 1000;

  // Traiter les occupations par lots
  console.log('📝 Import des occupations...');
  for (let i = 0; i < romeData.occupations.length; i += occupationBatchSize) {
    const batch = romeData.occupations.slice(i, i + occupationBatchSize);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MIGRATION_SECRET}`,
        },
        body: JSON.stringify({
          occupations: batch,
          tasks: [] // Pas de tâches dans ce lot
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error(`❌ Erreur lot occupations ${i}-${i+batch.length}:`, result.error);
        continue;
      }
      
      console.log(`✅ Occupations ${i+1}-${i+batch.length}/${romeData.occupations.length}`);
      
    } catch (error) {
      console.error(`❌ Erreur réseau lot ${i}:`, error.message);
    }
    
    // Pause entre les lots pour éviter les rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Traiter les tâches par lots
  console.log('📝 Import des tâches...');
  for (let i = 0; i < romeData.tasks.length; i += taskBatchSize) {
    const batch = romeData.tasks.slice(i, i + taskBatchSize);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MIGRATION_SECRET}`,
        },
        body: JSON.stringify({
          occupations: [], // Pas d'occupations dans ce lot
          tasks: batch
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error(`❌ Erreur lot tâches ${i}-${i+batch.length}:`, result.error);
        continue;
      }
      
      console.log(`✅ Tâches ${i+1}-${i+batch.length}/${romeData.tasks.length}`);
      
    } catch (error) {
      console.error(`❌ Erreur réseau lot ${i}:`, error.message);
    }
    
    // Pause entre les lots
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('🎉 Initialisation terminée !');
}

initVercelDataBatch();