#!/usr/bin/env node

/**
 * Script pour migrer les données ROME vers PostgreSQL sur Vercel
 */

const fs = require('fs');
const path = require('path');

async function migrateData() {
  // Vérifier l'existence du fichier JSON
  const dataFile = 'rome_data.json';
  if (!fs.existsSync(dataFile)) {
    console.error('❌ Fichier rome_data.json non trouvé');
    console.log('📝 Exécutez d\'abord: python3 export-rome-data.py');
    process.exit(1);
  }

  // Lire les données
  console.log('📖 Lecture des données...');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  console.log(`📊 ${data.occupations?.length || 0} occupations, ${data.tasks?.length || 0} tâches`);

  // URL de l'API (à adapter selon ton déploiement)
  const API_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/admin/migrate`
    : process.env.API_URL || 'https://ton-app.vercel.app/api/admin/migrate';

  const MIGRATION_SECRET = process.env.MIGRATION_SECRET;

  if (!MIGRATION_SECRET) {
    console.error('❌ Variable MIGRATION_SECRET manquante');
    console.log('💡 Définissez: export MIGRATION_SECRET="votre-secret"');
    process.exit(1);
  }

  console.log(`🚀 Migration vers ${API_URL}...`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIGRATION_SECRET}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Migration réussie !');
      console.log(`📊 Résultat: ${result.stats?.occupations || 0} occupations, ${result.stats?.tasks || 0} tâches`);
    } else {
      console.error('❌ Erreur de migration:', result.error || result.details);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
    process.exit(1);
  }
}

// Vérifier que fetch est disponible (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Cette version de Node.js ne supporte pas fetch');
  console.log('💡 Utilisez Node.js 18+ ou installez node-fetch');
  process.exit(1);
}

migrateData();